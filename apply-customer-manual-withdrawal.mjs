import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Hemera customer app: withdrawals are paid by the Hemera team by hand.
// The app no longer calls the process-withdrawal function (which tried an automatic Flutterwave
// transfer and refunded the wallet when it failed). The request now stays pending for admin.
// Run from the ROOT of the customer app:  node apply-customer-manual-withdrawal.mjs
const CHECK = () => existsSync(join('app', 'confirm-withdrawal.tsx'));
const WRONG_FOLDER = 'Run this from the root of the Hemera customer app (the folder with package.json and app/confirm-withdrawal.tsx).';
const PATCHES = [
 {
  "file": "app/confirm-withdrawal.tsx",
  "marker": "Nothing is sent automatically from the app",
  "edits": [
   [
    "    const { data: { session } } = await supabase.auth.getSession();\n    const res = await fetch(\n      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/process-withdrawal`,\n      {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json',\n          Authorization: `Bearer ${session?.access_token}`,\n        },\n        body: JSON.stringify({ requestId }),\n      }\n    );\n\n    setSubmitting(false);\n    const data = await res.json();\n\n    if (!res.ok) {\n      Alert.alert('Withdrawal Failed', data.error ?? 'Something went wrong. Your balance has been refunded.', [\n        { text: 'OK', onPress: () => router.replace('/wallet' as any) },\n      ]);\n      return;\n    }\n\n    Alert.alert('Withdrawal Requested', 'Your withdrawal is being processed and should arrive within 24 hours.', [",
    "    // The request stays \"pending\" for the Hemera team, who send the transfer to the bank\n    // account by hand. Nothing is sent automatically from the app.\n    void requestId;\n    setSubmitting(false);\n\n    Alert.alert('Withdrawal Requested', 'Your request has been sent. Hemera will transfer the money to your bank account within 24 hours.', ["
   ]
  ]
 }
];

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
