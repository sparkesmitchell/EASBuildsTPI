import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  saveExpoToken,
  saveGitHubToken,
  saveExpoUsername,
  saveExpoAccounts,
} from '@/lib/storage';
import { getCurrentUser } from '@/lib/easApi';
import { getGitHubUser } from '@/lib/githubApi';
import { Colors, Radius, Spacing } from '@/lib/theme';
import { Button, SectionLabel, Card } from '@/components/UI';

export default function SetupScreen() {
  const [expoToken, setExpoToken] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    if (!expoToken.trim() || !githubToken.trim()) {
      Alert.alert('Missing tokens', 'Please enter both tokens to continue.');
      return;
    }

    setLoading(true);
    try {
      const [expoUser, ghUser] = await Promise.all([
        getCurrentUser(expoToken.trim()),
        getGitHubUser(githubToken.trim()),
      ]);

      await saveExpoToken(expoToken.trim());
      await saveGitHubToken(githubToken.trim());
      await saveExpoUsername(expoUser.username);
      await saveExpoAccounts(expoUser.accounts.map((a: { name: string }) => a.name));

      Alert.alert(
        'Connected!',
        `Expo: @${expoUser.username}\nGitHub: ${ghUser.login}`,
        [{ text: 'Continue', onPress: () => router.replace('/repos') }]
      );
    } catch (e: any) {
      Alert.alert('Connection failed', e.message || 'Check your tokens and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.description}>
        EAS Builder needs read access to your repos and the ability to trigger builds on your behalf.
        Tokens are stored securely on your device.
      </Text>

      <SectionLabel label="Expo access token" />
      <Card style={{ gap: 10 }}>
        <Text style={styles.cardDesc}>
          Create one at expo.dev → Account Settings → Access Tokens. Needs build:create permission.
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://expo.dev/settings/access-tokens')}>
          <Text style={styles.link}>Open expo.dev/settings/access-tokens →</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="expo_..."
          placeholderTextColor={Colors.textTertiary}
          value={expoToken}
          onChangeText={setExpoToken}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
      </Card>

      <SectionLabel label="GitHub personal access token" />
      <Card style={{ gap: 10 }}>
        <Text style={styles.cardDesc}>
          Create a classic token at github.com → Settings → Developer settings. Needs{' '}
          <Text style={{ color: Colors.accentText }}>repo</Text> scope.
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/settings/tokens/new')}>
          <Text style={styles.link}>Open github.com/settings/tokens/new →</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="ghp_..."
          placeholderTextColor={Colors.textTertiary}
          value={githubToken}
          onChangeText={setGithubToken}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
      </Card>

      <Button
        label="Connect accounts"
        onPress={handleConnect}
        loading={loading}
        style={{ marginTop: Spacing.xl, width: '100%' }}
      />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 60,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  link: {
    fontSize: 13,
    color: Colors.accentText,
  },
  input: {
    backgroundColor: Colors.bg,
    borderWidth: 0.5,
    borderColor: Colors.borderLight,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    marginTop: 4,
  },
});
