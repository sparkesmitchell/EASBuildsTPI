import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getExpoToken } from '@/lib/storage';
import { getBuildStatus, Build } from '@/lib/easApi';
import { Colors, Radius, Spacing } from '@/lib/theme';
import { StatusBadge, Card, SectionLabel } from '@/components/UI';

const POLL_INTERVAL = 12000;

const STEP_ORDER = ['NEW', 'IN_QUEUE', 'IN_PROGRESS', 'FINISHED'] as const;

function stepState(buildStatus: Build['status'], step: string): 'done' | 'active' | 'pending' {
  const idx = STEP_ORDER.indexOf(step as any);
  const cur = STEP_ORDER.indexOf(buildStatus as any);
  if (buildStatus === 'ERRORED') {
    if (idx < cur) return 'done';
    if (idx === cur) return 'active';
    return 'pending';
  }
  if (cur > idx) return 'done';
  if (cur === idx) return 'active';
  return 'pending';
}

function StepRow({
  label,
  sub,
  state,
}: {
  label: string;
  sub?: string;
  state: 'done' | 'active' | 'pending';
}) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'active') {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
    }
  }, [state]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const dotColor =
    state === 'done' ? Colors.green :
    state === 'active' ? Colors.accent :
    Colors.textTertiary;

  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepDot, { backgroundColor: dotColor }]}>
        {state === 'active' && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 8,
                borderWidth: 1.5,
                borderColor: Colors.accent,
                transform: [{ rotate: spin }],
              },
            ]}
          />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.stepLabel,
            state === 'active' && { color: Colors.accentText },
            state === 'pending' && { color: Colors.textTertiary },
          ]}
        >
          {label}
        </Text>
        {sub && <Text style={styles.stepSub}>{sub}</Text>}
      </View>
    </View>
  );
}

export default function BuildingScreen() {
  const { buildIds, appName, profile, autoSubmit } = useLocalSearchParams<{
    buildIds: string;
    appName: string;
    profile: string;
    autoSubmit: string;
  }>();

  const ids = buildIds?.split(',') ?? [];
  const [builds, setBuilds] = useState<Build[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchBuilds();
    pollRef.current = setInterval(fetchBuilds, POLL_INTERVAL);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function fetchBuilds() {
    const token = await getExpoToken();
    if (!token) return;
    try {
      const results = await Promise.all(ids.map(id => getBuildStatus(token, id)));
      setBuilds(results);
      const allDone = results.every(
        b => b.status === 'FINISHED' || b.status === 'ERRORED' || b.status === 'CANCELED'
      );
      if (allDone && pollRef.current) {
        clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch {
      // silently retry
    }
  }

  function formatElapsed(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  const allFinished = builds.length > 0 && builds.every(
    b => b.status === 'FINISHED' || b.status === 'ERRORED' || b.status === 'CANCELED'
  );
  const anyError = builds.some(b => b.status === 'ERRORED');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.appName}>{appName}</Text>
          <Text style={styles.profileLabel}>{profile} · {ids.length} build{ids.length > 1 ? 's' : ''}</Text>
        </View>
        <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
      </View>

      {builds.length === 0 ? (
        <Card>
          <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>Waiting for build to start…</Text>
        </Card>
      ) : (
        builds.map((build, i) => (
          <Card key={build.id} style={{ marginBottom: Spacing.md }}>
            <View style={styles.buildHeader}>
              <Text style={styles.platformLabel}>{build.platform}</Text>
              <StatusBadge status={build.status} />
            </View>

            <View style={{ marginTop: Spacing.md }}>
              <StepRow
                label="Queued"
                sub="Waiting for a build worker"
                state={stepState(build.status, 'NEW')}
              />
              <StepRow
                label="In queue"
                sub="Worker assigned"
                state={stepState(build.status, 'IN_QUEUE')}
              />
              <StepRow
                label="Building"
                sub="Compiling & signing binary"
                state={stepState(build.status, 'IN_PROGRESS')}
              />
              {autoSubmit === '1' ? (
                <StepRow
                  label="Submit to TestFlight"
                  sub="Auto-submit after build"
                  state={build.status === 'FINISHED' ? 'active' : stepState(build.status, 'FINISHED')}
                />
              ) : (
                <StepRow
                  label="Finished"
                  state={stepState(build.status, 'FINISHED')}
                />
              )}
            </View>

            {build.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{build.error.message}</Text>
              </View>
            )}

            {build.logs?.url && (
              <TouchableOpacity onPress={() => Linking.openURL(build.logs!.url)} style={styles.logsBtn}>
                <Text style={styles.logsBtnText}>View full logs →</Text>
              </TouchableOpacity>
            )}

            {build.artifacts?.buildUrl && (
              <TouchableOpacity
                onPress={() => Linking.openURL(build.artifacts!.buildUrl!)}
                style={styles.downloadBtn}
              >
                <Text style={styles.downloadBtnText}>Download build artifact →</Text>
              </TouchableOpacity>
            )}
          </Card>
        ))
      )}

      {allFinished && (
        <View style={styles.doneSection}>
          <Text style={styles.doneTitle}>
            {anyError ? 'Build failed' : 'Build complete'}
          </Text>
          <Text style={styles.doneSub}>
            {anyError
              ? 'Check the logs above for details.'
              : autoSubmit === '1'
              ? 'Your build has been submitted to TestFlight. Apple usually processes it within 15–30 minutes.'
              : 'Your build is ready to download or submit manually.'}
          </Text>
          <TouchableOpacity
            style={styles.newBuildBtn}
            onPress={() => router.replace('/repos')}
          >
            <Text style={styles.newBuildBtnText}>Start a new build</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.newBuildBtn, { backgroundColor: Colors.bgCardAlt, marginTop: 8 }]}
            onPress={() => router.push('/history')}
          >
            <Text style={[styles.newBuildBtnText, { color: Colors.textSecondary }]}>View build history</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, paddingBottom: 60 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  appName: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  profileLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  timer: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.accentText,
    fontFamily: 'monospace',
  },
  buildHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 0.5,
    borderColor: Colors.border,
    gap: 12,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stepLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  stepSub: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  errorBox: {
    marginTop: Spacing.md,
    backgroundColor: Colors.redDim,
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 0.5,
    borderColor: Colors.red,
  },
  errorText: {
    fontSize: 12,
    color: Colors.redText,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  logsBtn: {
    marginTop: Spacing.md,
    paddingVertical: 8,
  },
  logsBtnText: {
    fontSize: 13,
    color: Colors.accentText,
  },
  downloadBtn: {
    marginTop: 4,
    paddingVertical: 8,
  },
  downloadBtnText: {
    fontSize: 13,
    color: Colors.greenText,
  },
  doneSection: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    gap: 10,
  },
  doneTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  doneSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  newBuildBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 13,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  newBuildBtnText: {
    color: Colors.white,
    fontWeight: '500',
    fontSize: 15,
  },
});
