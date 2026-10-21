import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Hemera customer app: the status bar (time, battery) always stays clear. Screens no longer
// scroll underneath it: a strip in the screen's own colour sits behind the status bar.
// Run from the ROOT of the customer app:  node apply-customer-status-bar.mjs
const CHECK = () => existsSync(join('app', '_layout.tsx')) && existsSync(join('app', 'checkout.tsx'));
const WRONG_FOLDER = 'Run this from the root of the Hemera customer app (the folder with package.json and app/checkout.tsx).';
const PATCHES = [
 {
  "file": "app/_layout.tsx",
  "marker": "StatusBarShield",
  "edits": [
   [
    "import { PushNotificationRegistrar } from '../src/components/notifications/PushNotificationRegistrar';\n",
    "import { PushNotificationRegistrar } from '../src/components/notifications/PushNotificationRegistrar';\nimport { StatusBarShield } from '../src/components/StatusBarShield';\n"
   ],
   [
    "                                  </Stack>\n\n                                  <ReferralRewardPrompt />",
    "                                  </Stack>\n\n                                  <StatusBarShield />\n                                  <ReferralRewardPrompt />"
   ]
  ]
 }
];
const NEW_FILES = {
 "src/components/StatusBarShield.tsx": "// Keeps the phone's status bar (time, battery, network) clear on every screen.\n// Android draws the app behind the status bar, so scrolling content used to slide under it.\n// This puts a solid strip, the same colour as the screen, behind the status bar so content\n// scrolls under the strip instead of under the time and battery icons.\nimport { StyleSheet, View } from 'react-native';\nimport { usePathname } from 'expo-router';\nimport { useSafeAreaInsets } from 'react-native-safe-area-context';\n\nconst DEFAULT = '#F5F3EE';\n\n// Screens whose background is not the usual one. null = the screen draws its own top (no strip).\nfunction colorFor(path: string): string | null {\n  if (path === '/onboarding' || path === '/lock') return null;\n  if (path.startsWith('/partner/')) return '#0B1020';          // restaurant page: photo at the top, light status bar\n  if (path === '/confirm-pickup' || path === '/schedule-pickup') return '#F9F9F9';\n  if (path === '/fund-wallet-account' || path === '/transaction-detail') return '#F7F8FC';\n  return DEFAULT;\n}\n\nexport function StatusBarShield() {\n  const insets = useSafeAreaInsets();\n  const pathname = usePathname() ?? '';\n  const color = colorFor(pathname);\n  if (!color || insets.top <= 0) return null;\n  return <View pointerEvents=\"none\" style={[styles.shield, { height: insets.top, backgroundColor: color }]} />;\n}\n\nconst styles = StyleSheet.create({\n  shield: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, elevation: 1000 },\n});\n"
};

if (!existsSync('package.json') || !CHECK()) {
  console.error(WRONG_FOLDER);
  process.exit(1);
}

const ROOT = typeof ROOT_DIR === 'function' ? ROOT_DIR() : '.';
const at = (f) => (ROOT === '.' ? f : join(ROOT, f));
const backupDir = join('.update-backup', new Date().toISOString().replace(/[:.]/g, '-'));
let changedFiles = 0, problems = 0;

for (const { file: rel, marker, doneIf = [], edits } of PATCHES) {
  const file = at(rel);
  if (!existsSync(file)) { console.log('  MISSING  ' + file); problems++; continue; }
  const original = readFileSync(file, 'utf8');
  const crlf = original.includes('\r\n');
  let text = original.replace(/\r\n/g, '\n');
  if ([marker, ...doneIf].some((m) => m && text.includes(m))) { console.log('  already  ' + file); continue; }
  const failed = [];
  for (const [oldStr, newStr] of edits) {
    const n = text.split(oldStr).length - 1;
    if (n !== 1) { failed.push((n === 0 ? 'not found: ' : 'found ' + n + ' times: ') + oldStr.split('\n')[0].trim().slice(0, 70)); continue; }
    text = text.replace(oldStr, () => newStr);
  }
  if (failed.length) {
    problems++;
    console.log('  SKIPPED  ' + file + ' (left unchanged; it differs from the version I patched)');
    for (const f of failed) console.log('             ' + f);
    continue;
  }
  if (crlf) text = text.replace(/\n/g, '\r\n');
  const b = join(backupDir, file);
  if (!existsSync(b)) { mkdirSync(dirname(b), { recursive: true }); copyFileSync(file, b); }
  writeFileSync(file, text);
  changedFiles++;
  console.log('  updated  ' + file);
}

for (const [rel, content] of Object.entries(typeof NEW_FILES === 'undefined' ? {} : NEW_FILES)) {
  const file = rel.startsWith('supabase/') ? rel : at(rel);
  if (existsSync(file) && readFileSync(file, 'utf8') === content) { console.log('  same     ' + file); continue; }
  if (existsSync(file)) { const b = join(backupDir, file); mkdirSync(dirname(b), { recursive: true }); copyFileSync(file, b); }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  changedFiles++;
  console.log('  wrote    ' + file);
}

console.log(`\nDone: ${changedFiles} file(s) changed${problems ? `, ${problems} problem(s) above — send me that file and I'll fix it` : ''}.`);
if (changedFiles) console.log(`Old versions are saved in ${backupDir}`);
