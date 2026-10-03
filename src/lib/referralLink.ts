import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

const STORAGE_KEY = 'hemera:pending-referral';

export async function capturePendingReferral(url: string | null) {
  if (!url) return;
  const { queryParams } = Linking.parse(url);
  const raw = queryParams?.ref;
  const value = (Array.isArray(raw) ? raw[0] : raw)?.toString().trim().toUpperCase();
  if (!value) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, value);
  } catch {}
}

export async function getPendingReferral() {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function clearPendingReferral() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}