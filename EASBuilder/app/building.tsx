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
import { getGitHubToken } from '@/lib/storage';
import { getLatestWorkflowRun, WorkflowRun } from '@/lib/githubApi';
import { Colors, Radius, Spacing } from '@/lib/theme';
import { Card, SectionLabel } from '@/components/UI';

const POLL_INTERVAL = 10000;

type StepState = 'done' | 'active' | 'pending' | 'error';

function stepStateFromRun(run: WorkflowRun | null, step: 'queued' | 'building' | 'done'): StepState {
  if (!run) return step === 'queued' ? 'active' : 'pending';
  const { status, conclusion } = run;
  if (step === 'queued') {
    if (status === 'queued' || status === 'waiting') return 'active';
    return 'done';
  }
  if (step === 'building') {
    if (status === 'queued' || status === 'waiting') return 'pending';
    if (status === 'in_progress') return 'active';
    return conclusion === 'failure' || conclusion === 'cancelled' ? 'error' : 'done';
  }
  if (step === 'done') {
    if (status !== 'completed') return 'pending';
    return conclusion === 'success' ? 'done' : 'error';
  }
  return 'pending';
}

function StepRow({ label, sub, state }: { label: string; sub?: string; state: StepState }) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'active') {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
      ).start();
    } else {
      spinAnim.stopAnimation();
    }
  }, [state]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const dotColor =
    state === 'done' ? Colors.green :
    state === 'active' ? Colors.accent :
    state === 'error' ? Colors.red :
    Colors.textTertiary;

  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepDot, { backgroundColor: dotColor }]}>
        {state === 'active' && (
          <Animated.View style={[
            StyleSheet.absoluteFill,
            { borderRadius: 8, borderWidth: 1.5, borderColor: Colors.accent, transform: [{ rotate: spin }] },
          ]} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[
          styles.stepLabel,
          state === 'active' && { color: Colors.accentText },
          state === 'pending' && { color: Colors.textTertiary },
          state === 'error' && { color: Colors.redText },
        ]}>
          {label}
        </Text>
        {sub && <Text style={styles.stepSub}>{sub}</Text>}
      </View>
    </View>
  );
}

export default function BuildingScreen() {
  const { owner, repo, branch, repoName, profile, autoSubmit } = useLocalSearchParams<{
    owner: string; repo: string; branch: string;
    repoName: string; profile: string; autoSubmit: string;
  }>();

  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchRun();
    pollRef.current = setInterval(fetchRun, POLL_INTERVAL);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function fetchRun() {
    const token = await getGitHubToken();
    if (!token) return;
    try {
      const latest = await getLatestWorkflowRun(token, owner, repo, branch);
      setRun(latest);
      if (latest?.status === 'completed') {
        if (pollRef.current) clearInterval(pollRef.current);
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

  const isComplete = run?.status === 'completed';
  const isSuccess = isComplete && run?.conclusion === 'success';
  const isFailed = isComplete && (run?.conclusion === 'failure' || run?.conclusion === 'cancelled');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.appName}>{repoName}</Text>
          <Text style={styles.profileLabel}>{profile} · {owner}/{repo}</Text>
        </View>
        <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
      </View>

      <Card style={{ marginBottom: Spacing.md }}>
        <View style={styles.buildHeader}>
          <Text style={styles.platformLabel}>GitHub Actions</Text>
          {run && (
            <Text style={[
              styles.statusBadge,
              isSuccess && { color: Colors.green, backgroundColor: Colors.greenDim },
              isFailed && { color: Colors.redText, backgroundColor: Colors.redDim },
              !isComplete && { color: Colors.accentText, backgroundColor: Colors.accentDim },
            ]}>
              {isSuccess ? 'success' : isFailed ? run.conclusion ?? 'failed' : run.status}
            </Text>
          )}
        </View>

        <View style={{ marginTop: Spacing.md }}>
          <StepRow
            label="Queued"
            sub="Waiting for a GitHub Actions runner"
            state={stepStateFromRun(run, 'queued')}
          />
          <StepRow
            label="Building"
            sub="Running eas build on the runner"
            state={stepStateFromRun(run, 'building')}
          />
          <StepRow
            label={autoSubmit === '1' ? 'Build & submit to TestFlight' : 'Finished'}
            sub={autoSubmit === '1' ? 'Auto-submit after successful build' : undefined}
            state={stepStateFromRun(run, 'done')}
          />
        </View>

        {run?.html_url && (
          <TouchableOpacity onPress={() => Linking.openURL(run.html_url)} style={styles.logsBtn}>
            <Text style={styles.logsBtnText}>View run on GitHub →</Text>
          </TouchableOpacity>
        )}
      </Card>

      {!run && (
        <Card>
          <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>
            Waiting for workflow to appear… (may take a few seconds)
          </Text>
        </Card>
      )}

      {isComplete && (
        <View style={styles.doneSection}>
          <Text style={styles.doneTitle}>
            {isSuccess ? 'Build complete' : 'Build failed'}
          </Text>
          <Text style={styles.doneSub}>
            {isSuccess
              ? autoSubmit === '1'
                ? 'Submitted to TestFlight. Apple usually processes it within 15–30 minutes.'
                : 'Your build is ready on EAS.'
              : `Workflow ${run?.conclusion ?? 'failed'}. Check the run on GitHub for logs.`}
          </Text>
          <TouchableOpacity style={styles.newBuildBtn} onPress={() => router.replace('/repos')}>
            <Text style={styles.newBuildBtnText}>Start a new build</Text>
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
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.xl,
  },
  appName: { fontSize: 18, fontWeight: '500', color: Colors.textPrimary },
  profileLabel: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  timer: { fontSize: 20, fontWeight: '500', color: Colors.accentText, fontFamily: 'monospace' },
  buildHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  platformLabel: {
    fontSize: 13, fontWeight: '500', color: Colors.textSecondary,
    fontFamily: 'monospace', letterSpacing: 0.5,
  },
  statusBadge: {
    fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full, overflow: 'hidden', letterSpacing: 0.3,
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 9,
    borderBottomWidth: 0.5, borderColor: Colors.border, gap: 12,
  },
  stepDot: { width: 16, height: 16, borderRadius: 8 },
  stepLabel: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  stepSub: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  logsBtn: { marginTop: Spacing.md, paddingVertical: 8 },
  logsBtnText: { fontSize: 13, color: Colors.accentText },
  doneSection: { marginTop: Spacing.xl, alignItems: 'center', gap: 10 },
  doneTitle: { fontSize: 20, fontWeight: '500', color: Colors.textPrimary },
  doneSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  newBuildBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.lg,
    paddingVertical: 13, paddingHorizontal: 28, width: '100%',
    alignItems: 'center', marginTop: 6,
  },
  newBuildBtnText: { color: Colors.white, fontWeight: '500', fontSize: 15 },
});
