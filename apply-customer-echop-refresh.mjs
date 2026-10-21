import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Hemera customer app: pull down on the E-Chop screen to refresh restaurants and meals.
// Also refreshes by itself when you come back to the E-Chop tab, every minute, and when the
// app comes back to the front, so a restaurant that opens or adds meals shows up.
// Run from the ROOT of the customer app:  node apply-customer-echop-refresh.mjs
// (This includes apply-customer-fresh-restaurants.mjs; you don't need to run that one.)
const CHECK = () => existsSync(join('src', 'hooks', 'useFood.ts')) && existsSync(join('app', '(tabs)', 'echop.tsx'));
const WRONG_FOLDER = 'Run this from the root of the Hemera customer app (the folder with package.json and src/hooks/useFood.ts).';
const PATCHES = [
 {
  "file": "src/hooks/useFood.ts",
  "marker": "refreshFoodData",
  "edits": [
   [
    "import { useEffect, useState } from 'react';\n",
    "import { useEffect, useState } from 'react';\nimport { AppState } from 'react-native';\n"
   ],
   [
    "function useSupabaseQuery<T>(fetcher: () => Promise<T>, initial: T, deps: unknown[]) {\n  const [data, setData] = useState<T>(initial);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<string | null>(null);\n\n  useEffect(() => {\n    let cancelled = false;\n    setLoading(true);\n    fetcher()\n      .then((result) => {\n        if (cancelled) return;\n        setData(result);\n        setError(null);\n      })\n      .catch((e: Error) => {\n        if (!cancelled) setError(e.message);\n      })\n      .finally(() => {\n        if (!cancelled) setLoading(false);\n      });\n    return () => {\n      cancelled = true;\n    };\n  }, deps);\n\n  return { data, loading, error };\n}",
    "const REFRESH_EVERY_MS = 60_000;\n\n// Everything on the E-Chop screens that loads restaurants or meals registers here, so a\n// pull-to-refresh (or coming back to the screen) can reload all of it at once.\nconst reloaders = new Set<() => Promise<void>>();\n\n/** Reload restaurants and meals everywhere. Resolves when all of them are done. */\nexport function refreshFoodData(): Promise<void> {\n  return Promise.all(Array.from(reloaders).map((r) => r())).then(() => undefined);\n}\n\nfunction useSupabaseQuery<T>(fetcher: () => Promise<T>, initial: T, deps: unknown[]) {\n  const [data, setData] = useState<T>(initial);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<string | null>(null);\n\n  useEffect(() => {\n    let cancelled = false;\n    let first = true;\n    let running: Promise<void> | null = null;\n\n    // Loads now, then again every minute, when the app comes back to the front, and on\n    // pull-to-refresh. Only the first load shows the spinner; later ones update quietly.\n    const run = (): Promise<void> => {\n      if (running) return running;\n      if (first) setLoading(true);\n      running = fetcher()\n        .then((result) => {\n          if (cancelled) return;\n          setData(result);\n          setError(null);\n        })\n        .catch((e: Error) => {\n          if (!cancelled) setError(e.message);\n        })\n        .finally(() => {\n          running = null;\n          if (!cancelled && first) setLoading(false);\n          first = false;\n        });\n      return running;\n    };\n\n    run();\n    reloaders.add(run);\n    const timer = setInterval(() => {\n      if (AppState.currentState === 'active') run();\n    }, REFRESH_EVERY_MS);\n    const sub = AppState.addEventListener('change', (s) => {\n      if (s === 'active') run();\n    });\n    return () => {\n      cancelled = true;\n      reloaders.delete(run);\n      clearInterval(timer);\n      sub.remove();\n    };\n  }, deps);\n\n  return { data, loading, error };\n}"
   ]
  ]
 },
 {
  "file": "app/(tabs)/echop.tsx",
  "marker": "refreshFoodData",
  "edits": [
   [
    "import { useState } from 'react';\nimport { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';\nimport { useRouter } from 'expo-router';",
    "import { useCallback, useRef, useState } from 'react';\nimport { RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';\nimport { useFocusEffect, useRouter } from 'expo-router';"
   ],
   [
    "import { ms } from '../../src/utils/responsive';\n",
    "import { ms } from '../../src/utils/responsive';\nimport { refreshFoodData } from '../../src/hooks/useFood';\n"
   ],
   [
    "  const [category, setCategory] = useState<FoodCategory>('All');\n",
    "  const [category, setCategory] = useState<FoodCategory>('All');\n  const [refreshing, setRefreshing] = useState(false);\n\n  // Pull down to reload restaurants and meals.\n  const onRefresh = useCallback(() => {\n    setRefreshing(true);\n    refreshFoodData().finally(() => setRefreshing(false));\n  }, []);\n\n  // Coming back to this tab reloads quietly (not on the very first visit, which loads anyway).\n  const visited = useRef(false);\n  useFocusEffect(\n    useCallback(() => {\n      if (visited.current) void refreshFoodData();\n      visited.current = true;\n    }, [])\n  );\n"
   ],
   [
    "        showsVerticalScrollIndicator={false}\n        bounces={false}\n      >",
    "        showsVerticalScrollIndicator={false}\n        refreshControl={\n          <RefreshControl\n            refreshing={refreshing}\n            onRefresh={onRefresh}\n            tintColor={foodColors.primary}\n            colors={[foodColors.primary]}\n            progressViewOffset={ms(8)}\n          />\n        }\n      >"
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
