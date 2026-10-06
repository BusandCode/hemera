import { View, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { ChangeSecretForm } from '../src/components/profile/ChangeSecretForm';
import { supabase } from '../src/lib/supabase';
import { ms } from '../src/utils/responsive';

export default function ChangePinScreen() {
  const router = useRouter();

  const handleSubmit = async (current: string, next: string) => {
    const { error } = await supabase.rpc('set_pin', {
      p_current_pin: current,
      p_new_pin: next,
    });
    if (error) {
      const msg = error.message ?? '';
      if (msg.includes('wrong_current_pin')) throw new Error('Current PIN is incorrect.');
      if (msg.includes('invalid_new_pin')) throw new Error('PIN must be exactly 4 digits.');
      throw new Error(msg || 'Could not update PIN.');
    }
    setTimeout(() => router.back(), 900);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Change Transaction PIN" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ChangeSecretForm
          currentLabel="Current PIN"
          newLabel="New PIN"
          confirmLabel="Confirm New PIN"
          minLength={4}
          keyboardType="number-pad"
          hint="Your 4-digit PIN is required to confirm payment on every E-Chop order and E-Wash booking."
          submitLabel="Update PIN"
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