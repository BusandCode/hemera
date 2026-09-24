import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';

import { BottomTabs } from '../../src/components/eplan/BottomTabs';
import { foodColors } from '../../src/constants/foodColors';

export default function EPlanLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.screen}>
        <Slot />
      </View>
      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  screen: { flex: 1 },
});