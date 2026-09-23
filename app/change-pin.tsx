
import { View, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { ChangeSecretForm } from '../src/components/profile/ChangeSecretForm';
import { useAppData } from '../src/context/AppDataContext';

export default function ChangePinScreen() {
  const router = useRouter();
  const { recordPinChange } = useAppData();

  const handleSubmit = () => {
    recordPinChange();
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
  content: { paddingHorizontal: '5.5%', paddingBottom: 30 },
});