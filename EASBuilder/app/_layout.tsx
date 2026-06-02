import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bg },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '500', fontSize: 16 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.bg },
          headerBackTitle: 'Back',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="setup" options={{ title: 'Connect accounts', headerBackVisible: false }} />
        <Stack.Screen name="repos" options={{ title: 'Choose repo' }} />
        <Stack.Screen name="configure" options={{ title: 'Configure build' }} />
        <Stack.Screen name="building" options={{ title: 'Build progress', headerBackVisible: false }} />
        <Stack.Screen name="history" options={{ title: 'Build history' }} />
      </Stack>
    </>
  );
}
