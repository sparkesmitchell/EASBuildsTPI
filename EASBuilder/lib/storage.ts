import * as SecureStore from 'expo-secure-store';

const EXPO_TOKEN_KEY = 'expo_access_token';
const GITHUB_TOKEN_KEY = 'github_access_token';
const EXPO_ACCOUNT_KEY = 'expo_account_username';

export async function saveExpoToken(token: string) {
  await SecureStore.setItemAsync(EXPO_TOKEN_KEY, token);
}

export async function getExpoToken(): Promise<string | null> {
  return SecureStore.getItemAsync(EXPO_TOKEN_KEY);
}

export async function saveGitHubToken(token: string) {
  await SecureStore.setItemAsync(GITHUB_TOKEN_KEY, token);
}

export async function getGitHubToken(): Promise<string | null> {
  return SecureStore.getItemAsync(GITHUB_TOKEN_KEY);
}

export async function saveExpoUsername(username: string) {
  await SecureStore.setItemAsync(EXPO_ACCOUNT_KEY, username);
}

export async function getExpoUsername(): Promise<string | null> {
  return SecureStore.getItemAsync(EXPO_ACCOUNT_KEY);
}

export async function clearAll() {
  await SecureStore.deleteItemAsync(EXPO_TOKEN_KEY);
  await SecureStore.deleteItemAsync(GITHUB_TOKEN_KEY);
  await SecureStore.deleteItemAsync(EXPO_ACCOUNT_KEY);
}
