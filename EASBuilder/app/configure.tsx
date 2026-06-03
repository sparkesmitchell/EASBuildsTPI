import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getGitHubToken } from '@/lib/storage';
import { triggerWorkflow } from '@/lib/githubApi';
import { Colors, Radius, Spacing } from '@/lib/theme';
import { SectionLabel, Card, Divider } from '@/components/UI';

type Platform = 'ios' | 'android' | 'all';
const PROFILES = ['development', 'preview', 'production'];

export default function ConfigureScreen() {
  const { repoFullName, repoName, branch } = useLocalSearchParams<{
    repoFullName: string;
    repoName: string;
    branch: string;
  }>();

  const [platform, setPlatform] = useState<Platform>('ios');
  const [profile, setProfile] = useState('production');
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [launching, setLaunching] = useState(false);

  const [owner, repo] = (repoFullName ?? '/').split('/');

  async function handleBuild() {
    const token = await getGitHubToken();
    if (!token) { router.replace('/setup'); return; }

    setLaunching(true);
    try {
      await triggerWorkflow(token, owner, repo, branch, platform, profile);
      router.replace({
        pathname: '/building',
        params: { owner, repo, branch, repoName, profile, autoSubmit: autoSubmit ? '1' : '0' },
      });
    } catch (e: any) {
      const msg = e.message ?? 'Failed to trigger build.';
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        Alert.alert(
          'Workflow not found',
          'Add the eas-build-tpi.yml workflow file to .github/workflows/ in your repo first.\n\nSee the EAS Build TPI README for the template.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Build failed to start', msg);
      }
    } finally {
      setLaunching(false);
    }
  }

  const PLAT_OPTIONS: { label: string; value: Platform }[] = [
    { label: 'iOS', value: 'ios' },
    { label: 'Android', value: 'android' },
    { label: 'Both', value: 'all' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryRepo}>{repoName}</Text>
        <Text style={styles.summaryBranch}>{branch}</Text>
      </View>

      <SectionLabel label="Platform" />
      <View style={styles.platformRow}>
        {PLAT_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setPlatform(opt.value)}
            style={[styles.platformBtn, platform === opt.value && styles.platformBtnActive]}
          >
            <Text style={[styles.platformLabel, platform === opt.value && { color: Colors.accentText }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionLabel label="Build profile" />
      <View style={styles.profileRow}>
        {PROFILES.map(p => (
          <TouchableOpacity
            key={p}
            onPress={() => setProfile(p)}
            style={[styles.profilePill, profile === p && styles.profilePillActive]}
          >
            <Text style={[styles.profileText, profile === p && { color: Colors.accentText }]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionLabel label="Options" />
      <Card style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
        <View style={styles.optionRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionLabel}>Auto-submit to TestFlight</Text>
            <Text style={styles.optionSub}>Passes --auto-submit to eas build</Text>
          </View>
          <Switch
            value={autoSubmit}
            onValueChange={setAutoSubmit}
            trackColor={{ true: Colors.accent, false: Colors.borderLight }}
            thumbColor={Colors.white}
          />
        </View>
        <Divider style={{ marginVertical: 0, marginHorizontal: Spacing.lg }} />
        <View style={styles.optionRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionLabel}>Build profile</Text>
            <Text style={styles.optionSub}>Using: {profile}</Text>
          </View>
        </View>
      </Card>

      <TouchableOpacity
        style={[styles.buildBtn, launching && { opacity: 0.6 }]}
        onPress={handleBuild}
        disabled={launching}
        activeOpacity={0.8}
      >
        {launching ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buildBtnText}>Start build</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.warningNote}>
        Requires an eas-build-tpi.yml workflow in .github/workflows/ of your repo.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, paddingBottom: 60 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  summaryRepo: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  summaryBranch: {
    fontSize: 13, color: Colors.accentText, fontFamily: 'monospace',
    backgroundColor: Colors.accentDim, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  platformRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  platformBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 0.5,
    borderColor: Colors.border, backgroundColor: Colors.bgCard, alignItems: 'center',
  },
  platformBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  platformLabel: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  profileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  profilePill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    borderWidth: 0.5, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  profilePillActive: { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  profileText: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'monospace' },
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 12,
  },
  optionLabel: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  optionSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  buildBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.lg, padding: 15,
    alignItems: 'center', marginTop: Spacing.xl,
  },
  buildBtnText: { color: Colors.white, fontSize: 16, fontWeight: '500' },
  warningNote: {
    fontSize: 12, color: Colors.textTertiary, textAlign: 'center',
    marginTop: Spacing.lg, lineHeight: 18,
  },
});
