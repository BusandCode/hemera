// Keeps the phone's status bar (time, battery, network) clear on every screen.
// Android draws the app behind the status bar, so scrolling content used to slide under it.
// This puts a solid strip, the same colour as the screen, behind the status bar so content
// scrolls under the strip instead of under the time and battery icons.
import { StyleSheet, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT = '#F5F3EE';

// Screens whose background is not the usual one. null = the screen draws its own top (no strip).
function colorFor(path: string): string | null {
  if (path === '/onboarding' || path === '/lock') return null;
  if (path.startsWith('/partner/')) return '#0B1020';          // restaurant page: photo at the top, light status bar
  if (path === '/confirm-pickup' || path === '/schedule-pickup') return '#F9F9F9';
  if (path === '/fund-wallet-account' || path === '/transaction-detail') return '#F7F8FC';
  return DEFAULT;
}

export function StatusBarShield() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname() ?? '';
  const color = colorFor(pathname);
  if (!color || insets.top <= 0) return null;
  return <View pointerEvents="none" style={[styles.shield, { height: insets.top, backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  shield: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, elevation: 1000 },
});
