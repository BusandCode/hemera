import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Hemera customer app: signing up with an email registered in Hemera Business is stopped
// before any account is created. Needs hemera_block_shared_emails.sql.
// Run from the ROOT of the customer app:  node apply-customer-block-partner-email.mjs
const CHECK = () => existsSync(join('app', 'auth.tsx'));
const WRONG_FOLDER = 'Run this from the root of the Hemera customer app (the folder with package.json and app/auth.tsx).';
const PATCHES = [
 {
  "file": "src/context/AuthContext.tsx",
  "marker": "hemera_email_kind",
  "edits": [
   [
    "    const referral = (referredBy || pending || '').trim().toUpperCase();\n    const { data, error } = await supabase.auth.signUp({",
    "    const referral = (referredBy || pending || '').trim().toUpperCase();\n\n    // An email used for Hemera Business can't become a customer account. Check before\n    // anything is created.\n    const { data: emailKind } = await supabase.rpc('hemera_email_kind', { p_email: email });\n    if (emailKind === 'partner') {\n      const err = new Error(\n        'This email is registered for Hemera Business (the partner app). Please use a different email for the Hemera app.'\n      ) as Error & { code?: string };\n      err.code = 'partner_account';\n      throw err;\n    }\n\n    const { data, error } = await supabase.auth.signUp({"
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
