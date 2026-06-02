import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { getGitHubToken, getExpoToken, clearAll } from '@/lib/storage';
import { getRepos, getBranches, GitHubRepo } from '@/lib/githubApi';
import { Colors, Radius, Spacing } from '@/lib/theme';
import { SectionLabel, EmptyState, Divider } from '@/components/UI';

export default function ReposScreen() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    loadRepos();
  }, []);

  async function loadRepos() {
    const token = await getGitHubToken();
    if (!token) { router.replace('/setup'); return; }
    try {
      const data = await getRepos(token);
      setRepos(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function selectRepo(repo: GitHubRepo) {
    setSelectedRepo(repo);
    setSelectedBranch(repo.default_branch);
    setLoadingBranches(true);
    try {
      const token = await getGitHubToken();
      if (!token) return;
      const [owner] = repo.full_name.split('/');
      const data = await getBranches(token, owner, repo.name);
      setBranches(data.map(b => b.name));
    } catch {
      setBranches([repo.default_branch]);
    } finally {
      setLoadingBranches(false);
    }
  }

  function handleNext() {
    if (!selectedRepo) return;
    router.push({
      pathname: '/configure',
      params: {
        repoFullName: selectedRepo.full_name,
        repoName: selectedRepo.name,
        branch: selectedBranch,
      },
    });
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return d === 1 ? '1d ago' : `${d}d ago`;
  }

  const filtered = repos.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.search}
          placeholder="Search repos…"
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <>
            <SectionLabel label={`${filtered.length} repos`} />
            {filtered.map(repo => (
              <TouchableOpacity
                key={repo.id}
                activeOpacity={0.7}
                onPress={() => selectRepo(repo)}
                style={[
                  styles.repoRow,
                  selectedRepo?.id === repo.id && styles.repoRowSelected,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.repoName}>{repo.name}</Text>
                    {repo.private && (
                      <View style={styles.privateBadge}>
                        <Text style={styles.privateBadgeText}>private</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.repoMeta}>
                    {repo.language ?? 'Unknown'} · pushed {timeAgo(repo.pushed_at)}
                  </Text>
                </View>
                {selectedRepo?.id === repo.id && (
                  <Text style={{ color: Colors.accentText, fontSize: 18 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            {filtered.length === 0 && <EmptyState message="No repos match your search." />}
          </>
        )}

        {selectedRepo && (
          <>
            <Divider style={{ marginTop: Spacing.xl }} />
            <SectionLabel label="Branch" />
            {loadingBranches ? (
              <ActivityIndicator color={Colors.accent} size="small" />
            ) : (
              <View style={styles.branchList}>
                {branches.map(b => (
                  <TouchableOpacity
                    key={b}
                    onPress={() => setSelectedBranch(b)}
                    style={[
                      styles.branchPill,
                      selectedBranch === b && styles.branchPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.branchPillText,
                        selectedBranch === b && { color: Colors.accentText },
                      ]}
                    >
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {selectedRepo && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>
              Configure build → {selectedRepo.name}:{selectedBranch}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, paddingBottom: 100 },
  search: {
    backgroundColor: Colors.bgCard,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  repoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  repoRowSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  repoName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  repoMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  privateBadge: {
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: Colors.borderLight,
  },
  privateBadgeText: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  branchList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  branchPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  branchPillSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  branchPillText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    backgroundColor: Colors.bg,
    borderTopWidth: 0.5,
    borderColor: Colors.border,
  },
  nextBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    padding: 14,
    alignItems: 'center',
  },
  nextBtnText: {
    color: Colors.white,
    fontWeight: '500',
    fontSize: 15,
  },
});
