import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { getExpoToken, getExpoAccounts } from '@/lib/storage';
import { getExpoApps, getRecentBuilds, Build, ExpoApp } from '@/lib/easApi';
import { Colors, Radius, Spacing } from '@/lib/theme';
import { StatusBadge, SectionLabel, EmptyState } from '@/components/UI';

export default function HistoryScreen() {
  const [apps, setApps] = useState<ExpoApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<ExpoApp | null>(null);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingBuilds, setLoadingBuilds] = useState(false);

  useEffect(() => {
    loadApps();
  }, []);

  async function loadApps() {
    const [token, accounts] = await Promise.all([getExpoToken(), getExpoAccounts()]);
    if (!token || accounts.length === 0) { router.replace('/setup'); return; }
    try {
      const data = await getExpoApps(token, accounts);
      setApps(data);
      if (data.length > 0) await selectApp(data[0], token);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoadingApps(false);
    }
  }

  async function selectApp(app: ExpoApp, tokenOverride?: string) {
    setSelectedApp(app);
    setLoadingBuilds(true);
    try {
      const token = tokenOverride ?? (await getExpoToken());
      if (!token) return;
      const data = await getRecentBuilds(token, app.id);
      setBuilds(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoadingBuilds(false);
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loadingApps ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <>
          <SectionLabel label="App" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {apps.map(app => (
                <TouchableOpacity
                  key={app.id}
                  onPress={() => selectApp(app)}
                  style={[
                    styles.appPill,
                    selectedApp?.id === app.id && styles.appPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.appPillText,
                      selectedApp?.id === app.id && { color: Colors.accentText },
                    ]}
                  >
                    {app.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <SectionLabel label="Recent builds" />
          {loadingBuilds ? (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: 20 }} />
          ) : builds.length === 0 ? (
            <EmptyState message="No builds found for this app." />
          ) : (
            builds.map(build => (
              <View key={build.id} style={styles.buildRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.buildPlatform}>{build.platform}</Text>
                    <Text style={styles.buildProfile}>{build.buildProfile}</Text>
                  </View>
                  <Text style={styles.buildTime}>{timeAgo(build.createdAt)}</Text>
                  {build.error && (
                    <Text style={styles.buildError} numberOfLines={1}>
                      {build.error.message}
                    </Text>
                  )}
                </View>
                <StatusBadge status={build.status} />
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.newBuildBtn}
            onPress={() => router.push('/repos')}
          >
            <Text style={styles.newBuildBtnText}>Start a new build →</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, paddingBottom: 60 },
  appPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  appPillSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  appPillText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  buildRow: {
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
  buildPlatform: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  buildProfile: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: 'monospace',
    backgroundColor: Colors.bgCardAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  buildTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  buildError: {
    fontSize: 11,
    color: Colors.redText,
    fontFamily: 'monospace',
  },
  newBuildBtn: {
    marginTop: Spacing.xl,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.accent,
    alignItems: 'center',
  },
  newBuildBtnText: {
    color: Colors.accentText,
    fontSize: 15,
    fontWeight: '500',
  },
});
