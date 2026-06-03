import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { getExpoToken, getGitHubToken, getExpoUsername } from '@/lib/storage';
import { Colors, Spacing } from '@/lib/theme';
import { Button } from '@/components/UI';

export default function IndexScreen() {
  const [checking, setChecking] = useState(true);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    checkAuth();
  }, []);

  async function checkAuth() {
    const expoToken = await getExpoToken();
    const githubToken = await getGitHubToken();

    setTimeout(() => {
      setChecking(false);
      if (expoToken && githubToken) {
        router.replace('/repos');
      }
    }, 800);
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.inner, { opacity }]}>
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>⬡</Text>
          </View>
          <Text style={styles.appName}>EAS Build TPI</Text>
          <Text style={styles.tagline}>Build & ship from your phone</Text>
          <Text style={styles.disclaimer}>
            Not affiliated with or endorsed by Expo or Expo Inc.
          </Text>
        </View>

        {!checking && (
          <View style={styles.actions}>
            <Button
              label="Get started"
              onPress={() => router.push('/setup')}
              style={{ width: '100%' }}
            />
            <Text style={styles.hint}>
              You'll need an Expo access token and a GitHub personal access token.
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 32,
    color: Colors.accentText,
  },
  appName: {
    fontSize: 28,
    fontWeight: '500',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  actions: {
    gap: 14,
    alignItems: 'center',
  },
  hint: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
});
