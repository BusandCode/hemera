import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Hemera customer app: promo codes are checked by the server (the discount is worked out
// again at checkout), and a clear message for the ₦1,000 minimum withdrawal.
// Run from the ROOT of the customer app:  node apply-customer-loopholes.mjs
// Publish with eas update BEFORE running hemera_close_loopholes.sql.
const CHECK = () => existsSync(join('app', 'checkout.tsx'));
const WRONG_FOLDER = 'Run this from the root of the Hemera customer app (the folder with package.json and app/checkout.tsx).';
const PATCHES = [
 {
  "file": "app/checkout.tsx",
  "marker": "promo_code: params.promoCode",
  "edits": [
   [
    "  const params = useLocalSearchParams<{ promoApplied?: string; discount?: string }>();",
    "  const params = useLocalSearchParams<{ promoApplied?: string; discount?: string; promoCode?: string }>();"
   ],
   [
    "            discount,\n            ...(foodReward && {",
    "            discount,\n            // The server works the discount out again from this code.\n            ...(promoApplied && params.promoCode ? { promo_code: params.promoCode } : {}),\n            ...(foodReward && {"
   ]
  ]
 },
 {
  "file": "app/confirm-withdrawal.tsx",
  "marker": "includes('minimum_amount')",
  "edits": [
   [
    "        rpcError.message.includes('insufficient_balance')\n          ? 'Insufficient wallet balance.'\n          : 'Could not create withdrawal request. Please try again.'",
    "        rpcError.message.includes('insufficient_balance')\n          ? 'Insufficient wallet balance.'\n          : rpcError.message.includes('minimum_amount')\n            ? 'The minimum withdrawal is ₦1,000.'\n            : 'Could not create withdrawal request. Please try again.'"
   ]
  ]
 }
];
const NEW_FILES = {
 "src/constants/promoCodes.ts": "import { supabase } from '../lib/supabase';\n\nexport type PromoCode = {\n  code: string;\n  percent: number;\n  label: string;\n};\n\n/**\n * Checks one promo code with the server (hemera_check_promo). Returns null when the code\n * doesn't exist, is inactive, is over its usage limit, or has expired.\n * The list of codes is not readable from the app, and the discount itself is worked out\n * again by the server at checkout, so it can't be changed from the app.\n */\nexport async function findPromo(input: string): Promise<PromoCode | null> {\n  const normalized = input.trim().toUpperCase();\n  if (!normalized) return null;\n\n  const { data, error } = await supabase.rpc('hemera_check_promo', { p_code: normalized });\n  if (error || !data) return null;\n\n  const row = data as { code?: string; percent?: number | string; label?: string | null };\n  const percent = Number(row.percent ?? 0);\n  if (!row.code || !(percent > 0)) return null;\n\n  return {\n    code: row.code,\n    percent,\n    label: row.label ?? '',\n  };\n}\n"
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
