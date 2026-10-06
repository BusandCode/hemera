import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { ChangeSecretForm } from '../src/components/profile/ChangeSecretForm';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const handleSubmit = async (current: string, next: string) => {
    const email = session?.user.email;
    if (!email) throw new Error('You need to be signed in.');

    // 1) Verify the current password.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (verifyError) {
      throw new Error('Current password is incorrect.');
    }

    // 2) Update to the new password.
    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    if (updateError) {
      throw new Error(updateError.message ?? 'Could not update password.');
    }

    // Small confirmation, then back.
    setTimeout(() => router.back(), 900);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Change Password" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ChangeSecretForm
          currentLabel="Current Password"
          newLabel="New Password"
          confirmLabel="Confirm New Password"
          minLength={8}
          hint="Use at least 8 characters. This password protects your Hemera account."
          submitLabel="Update Password"
          onSubmit={handleSubmit}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(30) },
});