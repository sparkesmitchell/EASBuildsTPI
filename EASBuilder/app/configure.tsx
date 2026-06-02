import React, { useEffect, useState } from 'react';
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
import { getExpoToken, getExpoUsername } from '@/lib/storage';
import { getExpoApps, triggerBuild, ExpoApp } from '@/lib/easApi';
import { Colors, Radius, Spacing } from '@/lib/theme';
import { SectionLabel, Card, Divider } from '@/components/UI';

type Platform = 'IOS' | 'ANDROID' | 'BOTH';
const PROFILES = ['development', 'preview', 'production'];

export default function ConfigureScreen() {
  const { repoName, branch } = useLocalSearchParams<{ repoName: string; branch: string }>();

  const [apps, setApps] = useState<ExpoApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<ExpoApp | null>(null);
  const [platform, setPlatform] = useState<Platform>('IOS');
  const [profile, setProfile] = useState('production');
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    loadApps();
  }, []);

  async function loadApps() {
    const [token, username] = await Promise.all([getExpoToken(), getExpoUsername()]);
    if (!token || !username) { router.replace('/setup'); return; }
    try {
      const data = await getExpoApps(token, username);
      setApps(data);
      if (data.length > 0) setSelectedApp(data[0]);
    } catch (e: any) {
      Alert.alert('Error loading apps', e.message);
    } finally {
      setLoadingApps(false);
    }
  }

  async function handleBuild() {
    if (!selectedApp) {
      Alert.alert('No app selected', 'Select which Expo app to build.');
      return;
    }

    const token = await getExpoToken();
    if (!token) { router.replace('/setup'); return; }

    setLaunching(true);
    try {
      const platforms: Array<'IOS' | 'ANDROID'> =
        platform === 'BOTH' ? ['IOS', 'ANDROID'] : [platform];

      const buildIds: string[] = [];
      for (const p of platforms) {
        const build = await triggerBuild(token, selectedApp.id, p, profile, autoSubmit);
        buildIds.push(build.id);
      }

      router.replace({
        pathname: '/building',
        params: {
          buildIds: buildIds.join(','),
          appName: selectedApp.name,
          profile,
          autoSubmit: autoSubmit ? '1' : '0',
        },
      });
    } catch (e: any) {
      Alert.alert('Build failed to start', e.message);
    } finally {
      setLaunching(false);
    }
  }

  const PLAT_OPTIONS: { label: string; value: Platform; icon: string }[] = [
    { label: 'iOS', value: 'IOS', icon: '' },
    { label: 'Android', value: 'ANDROID', icon: '' },
    { label: 'Both', value: 'BOTH', icon: '⬡' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryRepo}>{repoName}</Text>
        <Text style={styles.summaryBranch}>{branch}</Text>
      </View>

      <SectionLabel label="Expo app" />
      {loadingApps ? (
        <ActivityIndicator color={Colors.accent} />
      ) : apps.length === 0 ? (
        <Text style={styles.noApps}>No apps found in your Expo account.</Text>
      ) : (
        apps.map(app => (
          <TouchableOpacity
            key={app.id}
            onPress={() => setSelectedApp(app)}
            activeOpacity={0.7}
            style={[
              styles.appRow,
              selectedApp?.id === app.id && styles.appRowSelected,
            ]}
          >
            <View style={styles.appIcon}>
              <Text style={{ fontSize: 16 }}>⬡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.appName}>{app.name}</Text>
              <Text style={styles.appSlug}>@{app.fullName}</Text>
            </View>
            {selectedApp?.id === app.id && (
              <Text style={{ color: Colors.accentText, fontSize: 18 }}>✓</Text>
            )}
          </TouchableOpacity>
        ))
      )}

      <SectionLabel label="Platform" />
      <View style={styles.platformRow}>
        {PLAT_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setPlatform(opt.value)}
            style={[
              styles.platformBtn,
              platform === opt.value && styles.platformBtnActive,
            ]}
          >
            <Text
              style={[
                styles.platformLabel,
                platform === opt.value && { color: Colors.accentText },
              ]}
            >
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
            style={[
              styles.profilePill,
              profile === p && styles.profilePillActive,
            ]}
          >
            <Text
              style={[
                styles.profileText,
                profile === p && { color: Colors.accentText },
              ]}
            >
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
            <Text style={styles.optionSub}>
              Runs eas submit after a successful build
            </Text>
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
            <Text style={styles.optionLabel}>Production profile</Text>
            <Text style={styles.optionSub}>Using: {profile}</Text>
          </View>
        </View>
      </Card>

      <TouchableOpacity
        style={[styles.buildBtn, launching && { opacity: 0.6 }]}
        onPress={handleBuild}
        disabled={launching || loadingApps}
        activeOpacity={0.8}
      >
        {launching ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buildBtnText}>
            Start build {platform === 'BOTH' ? '(2 builds)' : ''}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.warningNote}>
        Make sure your project already has an eas.json and projectId configured — EAS Build requires one-time setup from a terminal first.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, paddingBottom: 60 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  summaryRepo: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  summaryBranch: {
    fontSize: 13,
    color: Colors.accentText,
    fontFamily: 'monospace',
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  noApps: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  appRowSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.accentDim,
    borderWidth: 0.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  appSlug: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  platformRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  platformBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
  },
  platformBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  platformLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  profileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profilePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  profilePillActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  profileText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
  },
  optionLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  optionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  buildBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    padding: 15,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  buildBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  warningNote: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});
