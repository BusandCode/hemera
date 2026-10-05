// src/lib/freshInstall.ts
// Makes a deleted-and-reinstalled app start from scratch (onboarding, signed out).
//
// Why this is needed: the Supabase login can survive an uninstall.
//  - iPhone: if the session is kept in SecureStore, it lives in the iOS Keychain,
//    which iOS does NOT wipe when the app is deleted.
//  - Android: Google Auto Backup restores the app's saved data on reinstall
//    (turned off in app.json with "allowBackup": false).
//
// AsyncStorage IS wiped on uninstall (once Android backup is off), so a marker
// stored there tells us whether this is the first launch of a fresh install.
// If it's missing, any session we find is left over from a previous install,
// so we sign out locally before the app reads it.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const INSTALL_MARKER = 'hemera:installed';

let pending: Promise<void> | null = null;

/** Runs once per app launch; every caller awaits the same result. */
export function ensureFreshInstallHandled(): Promise<void> {
  if (!pending) pending = run();
  return pending;
}

async function run() {
  try {
    const marker = await AsyncStorage.getItem(INSTALL_MARKER);
    if (marker) return; // normal launch — keep the user signed in

    // First launch after install: drop any leftover login.
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {}

    await AsyncStorage.setItem(INSTALL_MARKER, 'true');
  } catch {
    // Storage failing should never block the app from opening.
  }
}