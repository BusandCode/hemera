import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Hemera customer app: search works.
//  - E-Chop screen: typing in the search bar shows matching restaurants (name or what they serve)
//    and meals (name, description, category or restaurant). Clear it to go back.
//  - Today's Menu and the restaurant page: better matching (every word you type, any order,
//    in the meal name, description, category or restaurant). Today's Menu categories fixed.
//  - The search bar has an × to clear it.
// Run from the ROOT of the customer app:  node apply-customer-search.mjs
const CHECK = () => existsSync(join('src', 'components', 'food', 'SearchBar.tsx'));
const WRONG_FOLDER = 'Run this from the root of the Hemera customer app (the folder with package.json and src/components/food).';
const PATCHES = [
 {
  "file": "src/components/food/SearchBar.tsx",
  "marker": "x-circle",
  "edits": [
   [
    "import { View, TextInput, StyleSheet } from 'react-native';",
    "import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';"
   ],
   [
    "        value={value}\n        onChangeText={onChangeText}\n        numberOfLines={1}\n        maxFontSizeMultiplier={MAX_FONT_SCALE}\n      />\n    </View>",
    "        value={value}\n        onChangeText={onChangeText}\n        maxFontSizeMultiplier={MAX_FONT_SCALE}\n        returnKeyType=\"search\"\n        autoCorrect={false}\n        autoCapitalize=\"none\"\n        clearButtonMode=\"never\"\n      />\n      {!!value && onChangeText ? (\n        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>\n          <Feather name=\"x-circle\" size={ms(16)} color={foodColors.textMuted} />\n        </TouchableOpacity>\n      ) : null}\n    </View>"
   ]
  ]
 },
 {
  "file": "src/constants/foodData.ts",
  "marker": "used by search",
  "edits": [
   [
    "  logo: ImageSourcePropType;\n",
    "  logo: ImageSourcePropType;\n  /** What the restaurant serves, e.g. \"Nigerian · Rice · Grills\" (used by search). */\n  cuisine?: string;\n"
   ]
  ]
 },
 {
  "file": "src/hooks/useFood.ts",
  "marker": "cuisine: (s.cuisines",
  "edits": [
   [
    "    id: s.id,\n    name: s.name,\n",
    "    cuisine: (s.cuisines ?? []).join(' · '),\n    id: s.id,\n    name: s.name,\n"
   ]
  ]
 },
 {
  "file": "app/todays-menu.tsx",
  "marker": "searchMatch",
  "edits": [
   [
    "    return todaysMenu.filter((item) => {\n      const matchesCategory =\n        category === ALL_CATEGORY || (item as MenuItem & { category?: string }).category === category;\n      const matchesQuery =\n        !q || item.name.toLowerCase().includes(q) || item.partnerName.toLowerCase().includes(q);\n      return matchesCategory && matchesQuery;\n    });",
    "    return todaysMenu.filter((item) => {\n      const inCategory = category === ALL_CATEGORY || matchesCategory(item, category);\n      const inSearch = !q || searchMatch(q, item.name, item.description, item.category, item.partnerName, item.storeName);\n      return inCategory && inSearch;\n    });"
   ],
   [
    "import { FoodCategory, MenuItem, categories } from '../src/constants/foodData';",
    "import { FoodCategory, MenuItem, categories, matchesCategory } from '../src/constants/foodData';\nimport { searchMatch } from '../src/utils/search';"
   ]
  ]
 },
 {
  "file": "app/partner/[id].tsx",
  "marker": "searchMatch",
  "edits": [
   [
    "        items: q\n          ? c.items.filter(\n              (it) =>\n                it.name.toLowerCase().includes(q) ||\n                it.description.toLowerCase().includes(q)\n            )\n          : c.items,",
    "        items: q\n          ? c.items.filter((it) => searchMatch(q, it.name, it.description, it.category, c.title))\n          : c.items,"
   ],
   [
    "import { SearchBar } from '../../src/components/food/SearchBar';\n",
    "import { SearchBar } from '../../src/components/food/SearchBar';\nimport { searchMatch } from '../../src/utils/search';\n"
   ]
  ]
 },
 {
  "file": "app/(tabs)/echop.tsx",
  "marker": "EChopSearchResults",
  "edits": [
   [
    "import { TodaysMenu } from '../../src/components/food/TodaysMenu';",
    "import { TodaysMenu } from '../../src/components/food/TodaysMenu';\nimport { EChopSearchResults } from '../../src/components/food/EChopSearchResults';"
   ],
   [
    "  const [category, setCategory] = useState<FoodCategory>('All');\n",
    "  const [category, setCategory] = useState<FoodCategory>('All');\n  const [query, setQuery] = useState('');\n  const searching = query.trim().length > 0;\n"
   ],
   [
    "        <View style={[styles.searchSection, padded]}>\n          <SearchBar />\n        </View>\n\n        <View style={[styles.bannerSection, padded]}>\n          <PromoBanner />\n        </View>\n\n        <View style={[styles.categorySection, padded]}>\n          <CategoryTabs active={category} onSelect={setCategory} />\n        </View>\n\n        <View style={[styles.partnersSection, padded]}>\n          <NearbyPartners sidePadding={hPad} />\n        </View>\n\n        <View style={[styles.menuSection, padded]}>\n          <TodaysMenu category={category} />\n        </View>",
    "        <View style={[styles.searchSection, padded]}>\n          <SearchBar value={query} onChangeText={setQuery} />\n        </View>\n\n        {searching ? (\n          <View style={[styles.menuSection, padded]}>\n            <EChopSearchResults query={query} sidePadding={hPad} />\n          </View>\n        ) : (\n          <>\n            <View style={[styles.bannerSection, padded]}>\n              <PromoBanner />\n            </View>\n\n            <View style={[styles.categorySection, padded]}>\n              <CategoryTabs active={category} onSelect={setCategory} />\n            </View>\n\n            <View style={[styles.partnersSection, padded]}>\n              <NearbyPartners sidePadding={hPad} />\n            </View>\n\n            <View style={[styles.menuSection, padded]}>\n              <TodaysMenu category={category} />\n            </View>\n          </>\n        )}"
   ],
   [
    "        showsVerticalScrollIndicator={false}\n        refreshControl={",
    "        showsVerticalScrollIndicator={false}\n        keyboardShouldPersistTaps=\"handled\"\n        refreshControl={"
   ]
  ]
 }
];
const NEW_FILES = {
 "src/utils/search.ts": "// Search helper for meals and restaurants. Case and punctuation don't matter, and every word\n// typed must appear somewhere: \"jollof rice\" finds \"Jollof Rice & Chicken\", \"mama rice\" finds\n// rice from Mama Titi's.\nfunction normalize(s: string): string {\n  return s\n    .toLowerCase()\n    .normalize('NFD')\n    .replace(/[̀-ͯ]/g, '')\n    .replace(/[^a-z0-9]+/g, ' ')\n    .trim();\n}\n\nexport function searchMatch(query: string, ...fields: (string | null | undefined)[]): boolean {\n  const words = normalize(query).split(' ').filter(Boolean);\n  if (words.length === 0) return true;\n  const text = ' ' + normalize(fields.filter(Boolean).join(' ')) + ' ';\n  return words.every((w) => text.includes(w));\n}\n",
 "src/components/food/EChopSearchResults.tsx": "// Search results on the E-Chop screen: restaurants (by name or what they serve) and meals\n// (by name, description, category or restaurant). Shown in place of the normal E-Chop content\n// while there is text in the search bar.\nimport { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';\nimport { Feather } from '@expo/vector-icons';\nimport { useRouter } from 'expo-router';\nimport { foodColors } from '../../constants/foodColors';\nimport { fonts } from '../../constants/typography';\nimport { useAllMenuItems, usePartners } from '../../hooks/useFood';\nimport { searchMatch } from '../../utils/search';\nimport { ms, MAX_FONT_SCALE } from '../../utils/responsive';\nimport { PartnerCard } from './PartnerCard';\nimport { MenuItemCard } from './MenuItemCard';\n\nconst GAP = 10;\n\nexport function EChopSearchResults({ query, sidePadding = 16 }: { query: string; sidePadding?: number }) {\n  const router = useRouter();\n  const { width } = useWindowDimensions();\n  const { partners, loading: loadingPartners } = usePartners();\n  const { items, loading: loadingItems } = useAllMenuItems();\n\n  const restaurants = partners.filter((p) => searchMatch(query, p.name, p.cuisine));\n  const meals = items.filter((it) =>\n    searchMatch(query, it.name, it.description, it.category, it.partnerName, it.storeName)\n  );\n\n  const columns = width >= 600 ? 3 : 2;\n  const cardWidth = (width - sidePadding * 2 - GAP * (columns - 1)) / columns;\n  const loading = (loadingPartners && partners.length === 0) || (loadingItems && items.length === 0);\n\n  if (loading) {\n    return (\n      <View style={styles.state}>\n        <ActivityIndicator color={foodColors.primary} />\n      </View>\n    );\n  }\n\n  if (restaurants.length === 0 && meals.length === 0) {\n    return (\n      <View style={styles.state}>\n        <View style={styles.stateIcon}>\n          <Feather name=\"search\" size={ms(22)} color={foodColors.primary} />\n        </View>\n        <Text style={styles.stateTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>\n          No results for “{query.trim()}”\n        </Text>\n        <Text style={styles.stateText} maxFontSizeMultiplier={MAX_FONT_SCALE}>\n          Try another meal or restaurant name, like “jollof”, “suya” or “swallow”.\n        </Text>\n      </View>\n    );\n  }\n\n  return (\n    <View style={{ gap: ms(18) }}>\n      {restaurants.length > 0 && (\n        <View>\n          <Text style={styles.heading} maxFontSizeMultiplier={MAX_FONT_SCALE}>\n            RESTAURANTS ({restaurants.length})\n          </Text>\n          <View style={styles.grid}>\n            {restaurants.map((p) => (\n              <PartnerCard\n                key={p.id}\n                partner={p}\n                width={cardWidth}\n                onPress={() => router.push({ pathname: '/partner/[id]', params: { id: p.id } } as any)}\n              />\n            ))}\n          </View>\n        </View>\n      )}\n\n      {meals.length > 0 && (\n        <View>\n          <Text style={styles.heading} maxFontSizeMultiplier={MAX_FONT_SCALE}>\n            MEALS ({meals.length})\n          </Text>\n          <View style={{ gap: ms(12) }}>\n            {meals.slice(0, 50).map((it) => (\n              <MenuItemCard key={it.id} item={it} />\n            ))}\n          </View>\n        </View>\n      )}\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  heading: {\n    fontSize: ms(11),\n    fontFamily: fonts.poppins.bold,\n    color: foodColors.textMuted,\n    letterSpacing: 0.5,\n    marginBottom: ms(8),\n  },\n  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },\n  state: { alignItems: 'center', paddingVertical: ms(40), paddingHorizontal: ms(24), gap: ms(6) },\n  stateIcon: {\n    width: ms(52),\n    height: ms(52),\n    borderRadius: ms(16),\n    backgroundColor: foodColors.primaryLight,\n    alignItems: 'center',\n    justifyContent: 'center',\n    marginBottom: ms(6),\n  },\n  stateTitle: { fontSize: ms(15), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary, textAlign: 'center' },\n  stateText: {\n    fontSize: ms(12.5),\n    lineHeight: ms(18),\n    fontFamily: fonts.poppins.regular,\n    color: foodColors.textSecondary,\n    textAlign: 'center',\n  },\n});\n"
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
