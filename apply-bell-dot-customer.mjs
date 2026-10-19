import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Hemera (customer app): the red dot on the home bell shows only when there are unread notifications.
// Run from the ROOT of the customer app:  node apply-bell-dot-customer.mjs
const CHECK = () => existsSync(join('src', 'hooks', 'useFood.ts'));
const WRONG_FOLDER = "Run this from the root of the Hemera customer app (the folder with package.json and src/hooks/useFood.ts).";
const PATCHES = [
 {
  "file": "app/(tabs)/index.tsx",
  "marker": "UnreadDot",
  "edits": [
   [
    "\nimport { useAuth } from '../../src/context/AuthContext';",
    "\nimport { useAuth } from '../../src/context/AuthContext';\nimport { UnreadDot } from '../../src/components/notifications/UnreadDot';"
   ],
   [
    "\n              <View style={styles.bellDot} />",
    "\n              <UnreadDot style={styles.bellDot} />"
   ]
  ]
 }
];
const NEW_FILES = {
 "src/components/notifications/UnreadDot.tsx": "// Red dot on the bell when the customer has unread notifications.\n// Updates live (new notifications) and whenever the screen comes back into view\n// (e.g. after reading them on the Notifications screen).\nimport { useCallback, useEffect, useRef, useState } from 'react';\nimport { View, type StyleProp, type ViewStyle } from 'react-native';\nimport { useFocusEffect } from 'expo-router';\n\nimport { supabase } from '../../lib/supabase';\nimport { useAuth } from '../../context/AuthContext';\n\nexport function useHasUnreadNotifications() {\n  const { session } = useAuth();\n  const userId = session?.user.id;\n  const [hasUnread, setHasUnread] = useState(false);\n  // Each bell (one per tab screen) needs its own live channel name.\n  const channelKey = useRef(Math.random().toString(36).slice(2)).current;\n\n  const check = useCallback(async () => {\n    if (!userId) { setHasUnread(false); return; }\n    const { count, error } = await supabase\n      .from('notifications')\n      .select('id', { count: 'exact', head: true })\n      .eq('user_id', userId)\n      .is('read_at', null);\n    if (!error) setHasUnread((count ?? 0) > 0);\n  }, [userId]);\n\n  useFocusEffect(useCallback(() => { void check(); }, [check]));\n\n  useEffect(() => {\n    if (!userId) return;\n    const channel = supabase\n      .channel(`unread-dot-${userId}-${channelKey}`)\n      .on(\n        'postgres_changes',\n        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },\n        () => { void check(); }\n      )\n      .subscribe();\n    const timer = setInterval(() => { void check(); }, 60000);\n    return () => {\n      clearInterval(timer);\n      void supabase.removeChannel(channel);\n    };\n  }, [userId, check, channelKey]);\n\n  return hasUnread;\n}\n\nexport function UnreadDot({ style }: { style?: StyleProp<ViewStyle> }) {\n  const hasUnread = useHasUnreadNotifications();\n  return hasUnread ? <View style={style} /> : null;\n}\n"
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
