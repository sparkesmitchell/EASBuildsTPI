import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { getGitHubToken, getExpoToken, clearAll } from '@/lib/storage';
import { getRepos, GitHubRepo } from '@/lib/githubApi';
import { Colors, Radius, Spacing } from '@/lib/theme';
import { SectionLabel, EmptyState } from '@/components/UI';


export default function ReposScreen() {
  const navigation = useNavigation();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSignOut} hitSlop={12}>
          <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>Sign out</Text>
        </TouchableOpacity>
      ),
    });
    loadRepos();
  }, []);

  async function handleSignOut() {
    Alert.alert('Sign out', 'Clear saved tokens and return to setup?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          router.replace('/setup');
        },
      },
    ]);
  }

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

  function selectRepo(repo: GitHubRepo) {
    setSelectedRepo(repo);
  }

  function handleNext() {
    if (!selectedRepo) return;
    router.push({
      pathname: '/configure',
      params: {
        repoFullName: selectedRepo.full_name,
        repoName: selectedRepo.name,
        branch: selectedRepo.default_branch,
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

      </ScrollView>

      {selectedRepo && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>
              Configure build → {selectedRepo.name}
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
