import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Hemera customer app: every approved restaurant shows, even outside its opening hours.
// Opening hours (and "Accepting orders") only decide whether it can take an order now:
// closed restaurants show a "Closed" badge, their meals show "Closed now" instead of Add,
// and they are listed after the open ones. Checkout still refuses closed restaurants.
// Run from the ROOT of the customer app:  node apply-customer-show-closed.mjs
const CHECK = () => existsSync(join('src', 'hooks', 'useFood.ts')) && existsSync(join('app', 'cart.tsx'));
const WRONG_FOLDER = 'Run this from the root of the Hemera customer app (the folder with package.json and src/hooks/useFood.ts).';
const PATCHES = [
 {
  "file": "src/hooks/useFood.ts",
  "marker": "canOrder",
  "edits": [
   [
    "  price_level: string | null;\n  created_at: string;\n};",
    "  price_level: string | null;\n  created_at: string;\n  /** Set by loadStores: true when the restaurant can take orders right now (open and not paused). */\n  canOrder?: boolean;\n};"
   ],
   [
    "function toMenuItem(p: ProductRow, storeName: string): MenuItem {\n  return {\n    id: p.id,",
    "function toMenuItem(p: ProductRow, storeName: string, closed = false): MenuItem {\n  return {\n    closed,\n    id: p.id,"
   ],
   [
    "  return {\n    id: s.id,\n    name: s.name,\n    rating: 0,",
    "  return {\n    closed: s.canOrder === false,\n    id: s.id,\n    name: s.name,\n    rating: 0,"
   ],
   [
    "  const stores = (data ?? []) as StoreRow[];\n  // Closed or paused restaurants are hidden from customers.\n  const open = await orderableStoreIds();\n  return stores.filter((s) => (open ? open.has(s.id) : isOpenNow(s.hours_schedule)));",
    "  const stores = (data ?? []) as StoreRow[];\n  // Every approved restaurant is shown. Opening hours (and \"Accepting orders\") only decide\n  // whether it can take an order right now; closed ones show as \"Closed\" and can't be added to.\n  const open = await orderableStoreIds();\n  return stores\n    .map((s) => ({ ...s, canOrder: open ? open.has(s.id) : isOpenNow(s.hours_schedule) }))\n    .sort((a, b) => Number(b.canOrder) - Number(a.canOrder));   // open ones first"
   ],
   [
    "  const names = new Map(stores.map((s) => [s.id, s.name]));\n  const products = await loadProducts(stores.map((s) => s.id));\n  return products.map((p) => toMenuItem(p, names.get(p.store_id) ?? ''));",
    "  const byId = new Map(stores.map((s) => [s.id, s]));\n  const products = await loadProducts(stores.map((s) => s.id));\n  return products\n    .map((p) => toMenuItem(p, byId.get(p.store_id)?.name ?? '', byId.get(p.store_id)?.canOrder === false))\n    .sort((a, b) => Number(!!a.closed) - Number(!!b.closed));   // meals you can order first"
   ],
   [
    "      const items = products.map((p) => toMenuItem(p, store.name));",
    "      const items = products.map((p) => toMenuItem(p, store.name, store.canOrder === false));"
   ],
   [
    "        openNow: isOpenNow(store.hours_schedule),",
    "        openNow: store.canOrder !== false,"
   ]
  ]
 },
 {
  "file": "src/constants/foodData.ts",
  "marker": "closed?: boolean",
  "edits": [
   [
    "  image: string;\n  logo: ImageSourcePropType;\n};",
    "  image: string;\n  logo: ImageSourcePropType;\n  /** Closed right now (outside opening hours or not taking orders): shown, but can't order. */\n  closed?: boolean;\n};"
   ],
   [
    "  /** Delivery area of the partner that sells this item. */\n  state?: string;\n  lga?: string;\n};",
    "  /** Delivery area of the partner that sells this item. */\n  state?: string;\n  lga?: string;\n  /** The restaurant is closed right now, so this can't be added to the cart. */\n  closed?: boolean;\n};"
   ]
  ]
 },
 {
  "file": "src/components/food/PartnerCard.tsx",
  "marker": "closedChip",
  "edits": [
   [
    "        <Image source={{ uri: partner.image }} style={styles.image} />\n        <View style={styles.logo}>",
    "        <Image source={{ uri: partner.image }} style={[styles.image, partner.closed && styles.imageClosed]} />\n        {partner.closed && (\n          <View style={styles.closedChip}>\n            <Text style={styles.closedText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Closed</Text>\n          </View>\n        )}\n        <View style={styles.logo}>"
   ],
   [
    "  image: { width: '100%', height: '100%', borderRadius: ms(12) },",
    "  image: { width: '100%', height: '100%', borderRadius: ms(12) },\n  imageClosed: { opacity: 0.45 },\n  closedChip: {\n    position: 'absolute',\n    top: ms(6),\n    right: ms(6),\n    backgroundColor: 'rgba(26,26,26,0.85)',\n    borderRadius: ms(10),\n    paddingHorizontal: ms(8),\n    paddingVertical: ms(2),\n  },\n  closedText: { fontSize: ms(10), fontFamily: fonts.poppins.semiBold, color: '#fff' },"
   ]
  ]
 },
 {
  "file": "src/components/food/MenuItemCard.tsx",
  "marker": "closedBtn",
  "edits": [
   [
    "      <View style={[styles.actions, { width: actionsWidth, marginTop: Math.round(imageSize * 0.28) }]}>\n        <TouchableOpacity style={styles.addBtn} onPress={() => addItem(item, qty)} activeOpacity={0.85}>",
    "      <View style={[styles.actions, { width: actionsWidth, marginTop: Math.round(imageSize * 0.28) }]}>\n        {item.closed ? (\n          <View style={[styles.addBtn, styles.closedBtn]}>\n            <Text style={styles.addBtnText} maxFontSizeMultiplier={1.1}>CLOSED{'\\n'}NOW</Text>\n          </View>\n        ) : (\n        <>\n        <TouchableOpacity style={styles.addBtn} onPress={() => addItem(item, qty)} activeOpacity={0.85}>"
   ],
   [
    "            <Feather name=\"plus\" size={ms(16)} color={foodColors.textPrimary} />\n          </TouchableOpacity>\n        </View>\n      </View>\n    </View>\n  );\n}",
    "            <Feather name=\"plus\" size={ms(16)} color={foodColors.textPrimary} />\n          </TouchableOpacity>\n        </View>\n        </>\n        )}\n      </View>\n    </View>\n  );\n}"
   ],
   [
    "  addBtnIcon: { marginTop: 2 },",
    "  addBtnIcon: { marginTop: 2 },\n  closedBtn: { backgroundColor: foodColors.textMuted, paddingVertical: ms(9) },"
   ],
   [
    "        <View style={styles.addDot}>\n          <Feather name=\"plus\" size={ms(14)} color=\"#fff\" />\n        </View>",
    "        {!item.closed && (\n          <View style={styles.addDot}>\n            <Feather name=\"plus\" size={ms(14)} color=\"#fff\" />\n          </View>\n        )}"
   ]
  ]
 },
 {
  "file": "app/todays-menu.tsx",
  "marker": "closedLabel",
  "edits": [
   [
    "      <View style={styles.stepper}>\n        <TouchableOpacity\n          style={[styles.stepBtn, qty <= 1 && styles.controlDisabled]}",
    "      {item.closed ? (\n        <Text style={styles.closedLabel}>Closed now</Text>\n      ) : (\n      <View style={styles.stepper}>\n        <TouchableOpacity\n          style={[styles.stepBtn, qty <= 1 && styles.controlDisabled]}"
   ],
   [
    "        <TouchableOpacity style={styles.stepBtn} onPress={handlePlus}>\n          <Feather name=\"plus\" size={ms(13)} color={foodColors.textPrimary} />\n        </TouchableOpacity>\n      </View>\n    </View>",
    "        <TouchableOpacity style={styles.stepBtn} onPress={handlePlus}>\n          <Feather name=\"plus\" size={ms(13)} color={foodColors.textPrimary} />\n        </TouchableOpacity>\n      </View>\n      )}\n    </View>"
   ],
   [
    "  controlDisabled: { opacity: 0.35 },",
    "  controlDisabled: { opacity: 0.35 },\n  closedLabel: { fontSize: ms(11), fontFamily: fonts.poppins.semiBold, color: foodColors.textMuted, alignSelf: 'center' },"
   ]
  ]
 },
 {
  "file": "app/cart.tsx",
  "marker": "allMenuItemsOpen",
  "edits": [
   [
    "  const suggestions = useMemo<MenuItem[]>(() => {\n    if (allMenuItems.length === 0 || lines.length === 0) return [];\n",
    "  const suggestions = useMemo<MenuItem[]>(() => {\n    if (allMenuItems.length === 0 || lines.length === 0) return [];\n    const allMenuItemsOpen = allMenuItems.filter((it) => !it.closed);   // no suggestions from closed restaurants\n"
   ],
   [
    "    return allMenuItems\n",
    "    return allMenuItemsOpen\n"
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
