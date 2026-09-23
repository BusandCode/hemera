import { View, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { ChangeSecretForm } from '../src/components/profile/ChangeSecretForm';
import { useAppData } from '../src/context/AppDataContext';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { recordPasswordChange } = useAppData();

  const handleSubmit = () => {
    recordPasswordChange();
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
          hint="Use at least 8 characters. This password protects your BusandCode account — including saved cards and E-Chop / E-Wash order history."
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
  content: { paddingHorizontal: '5.5%', paddingBottom: 30 },
});