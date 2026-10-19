import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Hemera (customer app): multi-restaurant cart.
//  - Food from any number of restaurants in one cart; checkout grouped by restaurant with
//    subtotals; one payment. The database then makes one order per restaurant.
//  - Closed or paused restaurants are hidden; unavailable items are removed before payment.
//  - Every fee comes from the admin Pricing settings (delivery fee per restaurant).
//  - Orders list / Track Order show each restaurant's order and its own status.
// Includes the earlier "orders after payment / fees" update, so you only need this one.
// Run from the ROOT of the customer app (the folder with package.json):
//   node apply-multi-restaurant-customer.mjs
// It changes only the lines listed inside each file, skips a file it doesn't recognise,
// and backs up every file it changes. Safe to run twice.
const CHECK = () => existsSync(join('src', 'hooks', 'useFood.ts'));
const WRONG_FOLDER = 'Run this from the root of the Hemera customer app (the folder with package.json and src/hooks/useFood.ts).';
const PATCHES = [
 {
  "file": "src/constants/foodData.ts",
  "marker": "storeId?: string;",
  "edits": [
   [
    "  /** Delivery area of the partner that sells this item. */\n  state?: string;",
    "  /** Store (restaurant) that sells this item. A cart holds items from one store only. */\n  storeId?: string;\n  storeName?: string;\n  /** Delivery area of the partner that sells this item. */\n  state?: string;"
   ]
  ],
  "doneIf": []
 },
 {
  "file": "src/hooks/useFood.ts",
  "marker": "storeId: p.store_id,",
  "edits": [
   [
    "    partnerName: storeName.toUpperCase(),\n",
    "    partnerName: storeName.toUpperCase(),\n    storeId: p.store_id,\n    storeName,\n"
   ]
  ],
  "doneIf": [
   "hemera_orderable_store_ids"
  ]
 },
 {
  "file": "src/context/CartContext.tsx",
  "marker": "storeKeyOf",
  "edits": [
   [
    "import AsyncStorage from '@react-native-async-storage/async-storage';",
    "import { Alert } from 'react-native';\nimport AsyncStorage from '@react-native-async-storage/async-storage';"
   ],
   [
    "const STORAGE_KEY = 'echop:cart';\n",
    "const STORAGE_KEY = 'echop:cart';\n\n// One restaurant per order. Items are matched by store id (older saved carts fall back to the name).\nconst storeKeyOf = (item: MenuItem) => item.storeId || (item.partnerName || '').trim().toLowerCase();\nconst storeLabelOf = (item: MenuItem) =>\n  item.storeName ||\n  (item.partnerName || '').toLowerCase().replace(/\\b\\w/g, (c) => c.toUpperCase()) ||\n  'another restaurant';\n"
   ],
   [
    "  const hydrated = useRef(false);\n",
    "  const hydrated = useRef(false);\n  const linesRef = useRef<CartLine[]>([]);\n  linesRef.current = lines;\n"
   ],
   [
    "  const addItem = (item: MenuItem, qty = 1) => {\n    setLines((prev) => {",
    "  const addItem = (item: MenuItem, qty = 1) => {\n    // Items from another restaurant: ask before replacing the cart.\n    const other = linesRef.current.find((l) => storeKeyOf(l.item) !== storeKeyOf(item));\n    if (other) {\n      Alert.alert(\n        'Start a new order?',\n        `Your cart has items from ${storeLabelOf(other.item)}. You can order from one restaurant at a time.\\n\\nClear your cart and add this item from ${storeLabelOf(item)}?`,\n        [\n          { text: 'Keep my cart', style: 'cancel' },\n          { text: 'Start new order', style: 'destructive', onPress: () => setLines([{ item, qty }]) },\n        ],\n      );\n      return;\n    }\n    setLines((prev) => {"
   ]
  ],
  "doneIf": [
   "Items from any restaurant can share one cart"
  ]
 },
 {
  "file": "app/cart.tsx",
  "marker": "it.storeId === anchor.storeId",
  "edits": [
   [
    "      .filter((it) => !seedIds.has(it.id) && inDeliveryArea(it, location.state, location.lga))",
    "      // Only dishes from the same restaurant (one restaurant per order).\n      .filter(\n        (it) =>\n          !seedIds.has(it.id) &&\n          (!anchor.storeId || it.storeId === anchor.storeId) &&\n          inDeliveryArea(it, location.state, location.lga)\n      )"
   ]
  ],
  "doneIf": [
   "restaurantCount"
  ]
 },
 {
  "file": "app/checkout.tsx",
  "marker": "hemera_echop_can_order",
  "edits": [
   [
    "import { REFERRAL_FOOD_DISCOUNT } from '../src/constants/referral';",
    "import { usePricingSettings } from '../src/hooks/usePricingSettings';\nimport { supabase } from '../src/lib/supabase';"
   ],
   [
    "const DELIVERY_FEE = 500;\nconst SERVICE_FEE = 200;\n",
    "// Delivery and service fees come from the admin (Pricing settings), same as the cart screen.\n"
   ],
   [
    "  const { rewards } = useReferral();\n",
    "  const { rewards } = useReferral();\n  const { settings: pricing } = usePricingSettings();\n  const DELIVERY_FEE = pricing.echop_delivery_fee;\n  const SERVICE_FEE = pricing.echop_service_fee;\n"
   ],
   [
    "Math.min(REFERRAL_FOOD_DISCOUNT,",
    "Math.min(pricing.referral_food_discount,"
   ],
   [
    "  }, [itemsTotal, discount, lines.length]);",
    "  }, [itemsTotal, discount, lines.length, DELIVERY_FEE, SERVICE_FEE]);"
   ],
   [
    "  const handlePlaceOrder = () => {\n    if (!canPlace) return;\n",
    "  // One restaurant per order, and that restaurant must be open and taking orders.\n  const checkRestaurant = async (): Promise<boolean> => {\n    const stores = new Set(lines.map(({ item }) => item.storeId || item.partnerName));\n    if (stores.size > 1) {\n      void dialog.alert({\n        title: 'One restaurant per order',\n        message:\n          'Your cart has items from more than one restaurant. Please remove items so they all come from one restaurant.',\n        confirmText: 'OK',\n        icon: 'shopping-bag',\n      });\n      return false;\n    }\n    setPlacing(true);\n    try {\n      const { data, error } = await supabase.rpc('hemera_echop_can_order', {\n        p_product_ids: lines.map(({ item }) => item.id),\n      });\n      if (error) {\n        // Couldn't check (e.g. no connection): let the payment screen handle it.\n        console.warn('[checkout] restaurant check failed:', error.message);\n        return true;\n      }\n      const result = (data ?? {}) as { ok?: boolean; reason?: string; message?: string };\n      if (result.ok === false) {\n        void dialog.alert({\n          title:\n            result.reason === 'closed'\n              ? 'Restaurant closed'\n              : result.reason === 'paused'\n                ? 'Orders paused'\n                : \"Can't order right now\",\n          message: result.message ?? 'This restaurant is not taking orders right now.',\n          confirmText: 'OK',\n          icon: 'clock',\n        });\n        return false;\n      }\n      return true;\n    } finally {\n      setPlacing(false);\n    }\n  };\n\n  const handlePlaceOrder = async () => {\n    if (!canPlace) return;\n    if (!(await checkRestaurant())) return;\n"
   ],
   [
    "            lines: lines.map(({ item, qty }) => ({",
    "            store_id: lines[0].item.storeId ?? null,\n            store_name: lines[0].item.storeName ?? null,\n            lines: lines.map(({ item, qty }) => ({"
   ]
  ],
  "doneIf": [
   "deliveryTotal"
  ]
 },
 {
  "file": "app/fund-wallet-account.tsx",
  "marker": "savePendingOrder",
  "edits": [
   [
    "  const placeOrder = async (reference: string) => {\n",
    "  // Same WSH- reference for the saved copy and the order.\n  const washRefRef = useRef(`WSH-${Math.floor(100000 + Math.random() * 900000)}`);\n\n  /** The order row for E-Chop and pay-per-order E-Wash. */\n  const buildOrderRow = (reference: string, userId: string | undefined, email: string) => {\n    let draft: any = {};\n    try {\n      draft = JSON.parse(order ?? '{}');\n    } catch {}\n    const total = Number(amount);\n    if (isEchop) {\n      return {\n        user_id: userId,\n        order_type: 'echop',\n        status: 'placed',\n        total_kobo: Math.round(total * 100),\n        metadata: { ...(draft.metadata ?? {}), payment_method: 'transfer', tx_ref: reference },\n      };\n    }\n    const lines: { name: string; qty: number; price: number }[] = draft.lines ?? [];\n    const count = lines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0);\n    return {\n      user_id: userId,\n      order_type: 'ewash',\n      status: 'scheduled',\n      total_kobo: Math.round(total * 100),\n      metadata: {\n        ref: washRefRef.current,\n        title: 'E-Wash Pickup',\n        customer_email: email,\n        total,\n        subtotal: draft.subtotal ?? 0,\n        items: count,\n        lines,\n        express: !!draft.express,\n        slot: draft.pickupTime ?? '',\n        pickup_date: draft.pickupDateId ?? '',\n        address: draft.pickupAddress ?? '',\n        payment_method: 'transfer',\n        tx_ref: reference,\n      },\n    };\n  };\n\n  // Saves a copy of the order on the server as soon as the transfer account is shown.\n  // When the payment lands, the database creates the order from it, even if the app was closed.\n  const savePendingOrder = async (reference: string) => {\n    const payPerOrder = isEchop || (isEwash && !parsedDraft.covered && parsedDraft.kind !== 'subscription');\n    if (!payPerOrder || !reference) return;\n    try {\n      const { data: { session } } = await supabase.auth.getSession();\n      if (!session?.user) return;\n      const row = buildOrderRow(reference, session.user.id, session.user.email ?? '');\n      const { error } = await supabase.from('pending_orders').insert({\n        tx_ref: reference,\n        user_id: session.user.id,\n        order_type: row.order_type,\n        amount_kobo: row.total_kobo,\n        metadata: row.metadata,\n      });\n      if (error && error.code !== '23505') console.log('[fund-wallet] order copy not saved:', error.message);\n    } catch (e: any) {\n      console.log('[fund-wallet] order copy not saved:', e?.message ?? e);\n    }\n  };\n\n  const placeOrder = async (reference: string) => {\n"
   ],
   [
    "    const { data: { session } } = await withTimeout(supabase.auth.getSession(), 'auth.getSession');\n    const total = Number(amount);\n\n    const row = isEchop\n      ? {\n          user_id: session?.user.id,\n          order_type: 'echop',\n          status: 'placed',\n          total_kobo: total * 100,\n          metadata: { ...(draft.metadata ?? {}), payment_method: 'transfer', tx_ref: reference },\n        }\n      : (() => {\n          const lines: { name: string; qty: number; price: number }[] = draft.lines ?? [];\n          const count = lines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0);\n          return {\n            user_id: session?.user.id,\n            order_type: 'ewash',\n            status: 'scheduled',\n            total_kobo: total * 100,\n            metadata: {\n              ref: `WSH-${Math.floor(100000 + Math.random() * 900000)}`,\n              title: 'E-Wash Pickup',\n              customer_email: session?.user.email ?? '',\n              total,\n              subtotal: draft.subtotal ?? 0,\n              items: count,\n              lines,\n              express: !!draft.express,\n              slot: draft.pickupTime ?? '',\n              pickup_date: draft.pickupDateId ?? '',\n              address: draft.pickupAddress ?? '',\n              payment_method: 'transfer',\n              tx_ref: reference,\n            },\n          };\n        })();\n\n    const { error: insertError } = await withTimeout(supabase.from('orders').insert(row), 'insert into orders');\n\n    if (insertError) {\n",
    "    const { data: { session } } = await withTimeout(supabase.auth.getSession(), 'auth.getSession');\n    const row = buildOrderRow(reference, session?.user.id, session?.user.email ?? '');\n\n    // The database creates the order from the saved copy as soon as the payment lands,\n    // so it is usually there already.\n    const { data: existing } = await withTimeout(\n      supabase.from('orders').select('id').eq('metadata->>tx_ref', reference).limit(1),\n      'check existing order'\n    );\n    if (existing && existing.length > 0) return true;\n\n    const { error: insertError } = await withTimeout(supabase.from('orders').insert(row), 'insert into orders');\n\n    if (insertError) {\n      // Created by the database at the same moment: it's the same order.\n      if ((insertError as any).code === '23505') return true;\n"
   ],
   [
    "        setDetails(result);\n",
    "        setDetails(result);\n        void savePendingOrder(String(result.reference));\n"
   ]
  ],
  "doneIf": [
   "hemera_complete_paid_order"
  ]
 },
 {
  "file": "app/request-pickup.tsx",
  "marker": "pricing.laundry_express_fee",
  "edits": [
   [
    "import { ms } from '../src/utils/responsive';",
    "import { ms } from '../src/utils/responsive';\nimport { usePricingSettings } from '../src/hooks/usePricingSettings';"
   ],
   [
    "const EXPRESS_FEE = 1500;\n",
    ""
   ],
   [
    "export default function RequestPickupScreen() {\n",
    "export default function RequestPickupScreen() {\n  // Express fee comes from the admin (Pricing settings), same as the confirm screen.\n  const { settings: pricing } = usePricingSettings();\n  const EXPRESS_FEE = pricing.laundry_express_fee;\n"
   ]
  ],
  "doneIf": []
 },
 {
  "file": "app/refer-earn.tsx",
  "marker": "pricing.referral_food_discount",
  "edits": [
   [
    "import { ScreenHeader } from '../src/components/profile/ScreenHeader';",
    "import { ScreenHeader } from '../src/components/profile/ScreenHeader';\nimport { usePricingSettings } from '../src/hooks/usePricingSettings';"
   ],
   [
    "const FOOD_REWARD = `₦${REFERRAL_FOOD_DISCOUNT.toLocaleString('en-US')}`;\nconst LAUNDRY_REWARD = `${REFERRAL_LAUNDRY_PERCENT}%`;",
    "// Updated from the admin (Pricing settings) when the screen opens.\nlet FOOD_REWARD = `₦${REFERRAL_FOOD_DISCOUNT.toLocaleString('en-US')}`;\nlet LAUNDRY_REWARD = `${REFERRAL_LAUNDRY_PERCENT}%`;"
   ],
   [
    "    subtitle: `Pick ${FOOD_REWARD} off your next food order or ${LAUNDRY_REWARD} off your next laundry plan`,",
    "    get subtitle() {\n      return `Pick ${FOOD_REWARD} off your next food order or ${LAUNDRY_REWARD} off your next laundry plan`;\n    },"
   ],
   [
    "export default function ReferEarnScreen() {\n",
    "export default function ReferEarnScreen() {\n  const { settings: pricing } = usePricingSettings();\n  FOOD_REWARD = `₦${Number(pricing.referral_food_discount).toLocaleString('en-US')}`;\n  LAUNDRY_REWARD = `${pricing.referral_laundry_percent}%`;\n"
   ]
  ],
  "doneIf": []
 },
 {
  "file": "src/components/referral/ReferralRewardPrompt.tsx",
  "marker": "usePricingSettings",
  "edits": [
   [
    "import { useReferral, RewardType } from '../../context/ReferralContext';",
    "import { useReferral, RewardType } from '../../context/ReferralContext';\nimport { usePricingSettings } from '../../hooks/usePricingSettings';"
   ],
   [
    "export function ReferralRewardPrompt() {\n",
    "export function ReferralRewardPrompt() {\n  // Reward amounts come from the admin (Pricing settings).\n  const { settings: pricing } = usePricingSettings();\n  const foodReward = `₦${Number(pricing.referral_food_discount).toLocaleString('en-US')}`;\n  const laundryReward = `${pricing.referral_laundry_percent}%`;\n"
   ],
   [
    "            Apply 1,000 Naira off your next food order OR a 5% discount to your next laundry\n            subscription?",
    "            Apply {foodReward} off your next food order OR a {laundryReward} discount to your next laundry\n            subscription?"
   ],
   [
    "<Text style={styles.primaryBtnText}>₦1,000 off food order</Text>",
    "<Text style={styles.primaryBtnText}>{foodReward} off food order</Text>"
   ],
   [
    "<Text style={styles.secondaryBtnText}>5% off laundry subscription</Text>",
    "<Text style={styles.secondaryBtnText}>{laundryReward} off laundry subscription</Text>"
   ]
  ],
  "doneIf": []
 },
 {
  "file": "src/hooks/useFood.ts",
  "marker": "hemera_orderable_store_ids",
  "edits": [
   [
    "  const { data, error } = await q;\n  if (error) throw new Error(error.message);\n  return (data ?? []) as StoreRow[];\n}\n",
    "  const { data, error } = await q;\n  if (error) throw new Error(error.message);\n  const stores = (data ?? []) as StoreRow[];\n  // Closed or paused restaurants are hidden from customers.\n  const open = await orderableStoreIds();\n  return stores.filter((s) => (open ? open.has(s.id) : isOpenNow(s.hours_schedule)));\n}\n\n/** Stores customers can order from right now (open by their hours and not paused). Null if the check fails. */\nasync function orderableStoreIds(): Promise<Set<string> | null> {\n  const { data, error } = await supabase.rpc('hemera_orderable_store_ids');\n  if (error || !Array.isArray(data)) return null;\n  return new Set(\n    (data as unknown[]).map((r) => String(r && typeof r === 'object' ? Object.values(r as object)[0] : r))\n  );\n}\n"
   ]
  ]
 },
 {
  "file": "src/context/CartContext.tsx",
  "marker": "Items from any restaurant can share one cart",
  "edits": [
   [
    "import { Alert } from 'react-native';\n",
    ""
   ],
   [
    "const STORAGE_KEY = 'echop:cart';\n\n// One restaurant per order. Items are matched by store id (older saved carts fall back to the name).\nconst storeKeyOf = (item: MenuItem) => item.storeId || (item.partnerName || '').trim().toLowerCase();\nconst storeLabelOf = (item: MenuItem) =>\n  item.storeName ||\n  (item.partnerName || '').toLowerCase().replace(/\\b\\w/g, (c) => c.toUpperCase()) ||\n  'another restaurant';\n",
    "const STORAGE_KEY = 'echop:cart';\n"
   ],
   [
    "  const linesRef = useRef<CartLine[]>([]);\n  linesRef.current = lines;\n",
    ""
   ],
   [
    "  const addItem = (item: MenuItem, qty = 1) => {\n    // Items from another restaurant: ask before replacing the cart.\n    const other = linesRef.current.find((l) => storeKeyOf(l.item) !== storeKeyOf(item));\n    if (other) {\n      Alert.alert(\n        'Start a new order?',\n        `Your cart has items from ${storeLabelOf(other.item)}. You can order from one restaurant at a time.\\n\\nClear your cart and add this item from ${storeLabelOf(item)}?`,\n        [\n          { text: 'Keep my cart', style: 'cancel' },\n          { text: 'Start new order', style: 'destructive', onPress: () => setLines([{ item, qty }]) },\n        ],\n      );\n      return;\n    }\n    setLines((prev) => {",
    "  const addItem = (item: MenuItem, qty = 1) => {\n    // Items from any restaurant can share one cart: one checkout, split per restaurant after payment.\n    setLines((prev) => {"
   ]
  ]
 },
 {
  "file": "app/cart.tsx",
  "marker": "restaurantCount",
  "edits": [
   [
    "      // Only dishes from the same restaurant (one restaurant per order).\n      .filter(\n        (it) =>\n          !seedIds.has(it.id) &&\n          (!anchor.storeId || it.storeId === anchor.storeId) &&\n          inDeliveryArea(it, location.state, location.lga)\n      )",
    "      .filter((it) => !seedIds.has(it.id) && inDeliveryArea(it, location.state, location.lga))"
   ],
   [
    "  const hasFoodReward = !!rewards.food;\n",
    "  const hasFoodReward = !!rewards.food;\n  // Delivery fee is charged once per restaurant in the cart.\n  const restaurantCount = useMemo(\n    () => new Set(lines.map(({ item }) => item.storeId || item.partnerName)).size,\n    [lines]\n  );\n"
   ],
   [
    "      (lines.length > 0 ? pricing.echop_delivery_fee + pricing.echop_service_fee : 0);",
    "      (lines.length > 0 ? pricing.echop_delivery_fee * restaurantCount + pricing.echop_service_fee : 0);"
   ],
   [
    "  }, [itemsTotal, appliedPromo, lines.length, hasFoodReward, pricing]);",
    "  }, [itemsTotal, appliedPromo, lines.length, hasFoodReward, pricing, restaurantCount]);"
   ],
   [
    "                  <Text style={styles.summaryLabel}>Delivery Fee</Text>\n                  <Text style={styles.summaryValue}>{formatNaira(pricing.echop_delivery_fee)}</Text>",
    "                  <Text style={styles.summaryLabel}>\n                    {restaurantCount > 1 ? `Delivery Fee (${restaurantCount} restaurants)` : 'Delivery Fee'}\n                  </Text>\n                  <Text style={styles.summaryValue}>\n                    {formatNaira(pricing.echop_delivery_fee * restaurantCount)}\n                  </Text>"
   ]
  ]
 },
 {
  "file": "app/checkout.tsx",
  "marker": "deliveryTotal",
  "edits": [
   [
    "  const { lines, itemCount, total: itemsTotal } = useCart();",
    "  const { lines, itemCount, total: itemsTotal, removeItem } = useCart();"
   ],
   [
    "  const SERVICE_FEE = pricing.echop_service_fee;\n",
    "  const SERVICE_FEE = pricing.echop_service_fee;\n\n  // The cart grouped by restaurant. After payment each restaurant gets its own order.\n  const groups = useMemo(() => {\n    const map = new Map<string, { key: string; name: string; lines: typeof lines; subtotal: number }>();\n    for (const line of lines) {\n      const key = line.item.storeId || line.item.partnerName || 'restaurant';\n      const name =\n        line.item.storeName ||\n        (line.item.partnerName || 'Restaurant').toLowerCase().replace(/\\b\\w/g, (c) => c.toUpperCase());\n      const g = map.get(key) ?? { key, name, lines: [], subtotal: 0 };\n      g.lines.push(line);\n      g.subtotal += line.item.price * line.qty;\n      map.set(key, g);\n    }\n    return [...map.values()];\n  }, [lines]);\n  // Delivery fee once per restaurant, service fee once per checkout.\n  const deliveryTotal = DELIVERY_FEE * groups.length;\n"
   ],
   [
    "    return { total: base + (lines.length > 0 ? DELIVERY_FEE + SERVICE_FEE : 0) };\n  }, [itemsTotal, discount, lines.length, DELIVERY_FEE, SERVICE_FEE]);",
    "    return { total: base + (lines.length > 0 ? deliveryTotal + SERVICE_FEE : 0) };\n  }, [itemsTotal, discount, lines.length, deliveryTotal, SERVICE_FEE]);"
   ],
   [
    "  // One restaurant per order, and that restaurant must be open and taking orders.\n  const checkRestaurant = async (): Promise<boolean> => {\n    const stores = new Set(lines.map(({ item }) => item.storeId || item.partnerName));\n    if (stores.size > 1) {\n      void dialog.alert({\n        title: 'One restaurant per order',\n        message:\n          'Your cart has items from more than one restaurant. Please remove items so they all come from one restaurant.',\n        confirmText: 'OK',\n        icon: 'shopping-bag',\n      });\n      return false;\n    }\n    setPlacing(true);\n    try {\n      const { data, error } = await supabase.rpc('hemera_echop_can_order', {\n        p_product_ids: lines.map(({ item }) => item.id),\n      });\n      if (error) {\n        // Couldn't check (e.g. no connection): let the payment screen handle it.\n        console.warn('[checkout] restaurant check failed:', error.message);\n        return true;\n      }\n      const result = (data ?? {}) as { ok?: boolean; reason?: string; message?: string };\n      if (result.ok === false) {\n        void dialog.alert({\n          title:\n            result.reason === 'closed'\n              ? 'Restaurant closed'\n              : result.reason === 'paused'\n                ? 'Orders paused'\n                : \"Can't order right now\",\n          message: result.message ?? 'This restaurant is not taking orders right now.',\n          confirmText: 'OK',\n          icon: 'clock',\n        });\n        return false;\n      }\n      return true;\n    } finally {\n      setPlacing(false);\n    }\n  };\n\n  const handlePlaceOrder = async () => {\n    if (!canPlace) return;\n    if (!(await checkRestaurant())) return;\n",
    "  // Everything in the cart must still be available: in stock, restaurant open and not paused.\n  // Anything that isn't is taken out of the cart before payment.\n  const checkAvailability = async (): Promise<boolean> => {\n    setPlacing(true);\n    try {\n      const { data, error } = await supabase.rpc('hemera_echop_unavailable_items', {\n        p_product_ids: lines.map(({ item }) => item.id),\n      });\n      if (error) {\n        // Couldn't check (e.g. no connection): the payment step will handle it.\n        console.warn('[checkout] availability check failed:', error.message);\n        return true;\n      }\n      const gone = new Set(((data ?? []) as string[]).map(String));\n      const removed = lines.filter(({ item }) => gone.has(item.id));\n      if (removed.length === 0) return true;\n      removed.forEach(({ item }) => removeItem(item.id));\n      const count = removed.reduce((sum, l) => sum + l.qty, 0);\n      void dialog.alert({\n        title: 'Some items are no longer available',\n        message:\n          lines.length === removed.length\n            ? 'Nothing in your cart can be ordered right now, so we removed it. Please choose something else.'\n            : `We removed ${count} item${count === 1 ? '' : 's'} that can't be ordered right now. Please check your order and try again.`,\n        confirmText: 'OK',\n        icon: 'shopping-bag',\n      });\n      return false;\n    } finally {\n      setPlacing(false);\n    }\n  };\n\n  const handlePlaceOrder = async () => {\n    if (!canPlace) return;\n    if (!(await checkAvailability())) return;\n"
   ],
   [
    "            store_id: lines[0].item.storeId ?? null,\n            store_name: lines[0].item.storeName ?? null,\n            lines: lines.map(({ item, qty }) => ({",
    "            restaurants: groups.length,\n            delivery_fee: deliveryTotal,\n            service_fee: SERVICE_FEE,\n            lines: lines.map(({ item, qty }) => ({\n              store_id: item.storeId ?? null,\n              store_name: item.storeName ?? null,"
   ],
   [
    "        <Text style={styles.sectionLabel}>Items ({itemCount})</Text>\n        <View style={styles.group}>\n          {lines.map(({ item, qty }, i) => {\n            const isLast = i === lines.length - 1;\n            return (\n              <View key={item.id} style={[styles.row, isLast && styles.rowLast]}>\n                <View style={styles.qtyBubble}>\n                  <Text style={styles.qtyBubbleText}>{qty}×</Text>\n                </View>\n                <View style={styles.rowTextBlock}>\n                  <Text style={styles.rowTitle} numberOfLines={1}>\n                    {item.name}\n                  </Text>\n                  <Text style={styles.rowSubtitle} numberOfLines={1}>\n                    {item.partnerName}\n                  </Text>\n                </View>\n                <Text style={styles.rowPrice}>\n                  {formatNaira(item.price * qty)}\n                </Text>\n              </View>\n            );\n          })}\n        </View>\n",
    "        <Text style={styles.sectionLabel}>\n          Items ({itemCount}){groups.length > 1 ? ` · ${groups.length} restaurants` : ''}\n        </Text>\n        {groups.map((g, gi) => (\n          <View key={g.key} style={[styles.group, gi > 0 && styles.storeGroupGap]}>\n            <View style={[styles.row, styles.storeHeaderRow]}>\n              <View style={styles.iconWrap}>\n                <MaterialCommunityIcons name=\"storefront-outline\" size={ms(17)} color={foodColors.primary} />\n              </View>\n              <Text style={[styles.rowTitle, styles.storeFlex]} numberOfLines={1}>\n                {g.name}\n              </Text>\n              <Text style={styles.rowPrice}>{formatNaira(g.subtotal)}</Text>\n            </View>\n            {g.lines.map(({ item, qty }) => (\n              <View key={item.id} style={styles.row}>\n                <View style={styles.qtyBubble}>\n                  <Text style={styles.qtyBubbleText}>{qty}×</Text>\n                </View>\n                <View style={styles.rowTextBlock}>\n                  <Text style={styles.rowTitle} numberOfLines={1}>\n                    {item.name}\n                  </Text>\n                </View>\n                <Text style={styles.rowPrice}>{formatNaira(item.price * qty)}</Text>\n              </View>\n            ))}\n            <View style={[styles.row, styles.rowLast]}>\n              <Text style={[styles.rowSubtitle, styles.storeFootLabel]} numberOfLines={1}>\n                Delivery from {g.name}\n              </Text>\n              <Text style={styles.rowSubtitle}>{formatNaira(DELIVERY_FEE)}</Text>\n            </View>\n          </View>\n        ))}\n"
   ],
   [
    "            <Text style={styles.summaryLabel}>Delivery fee</Text>\n            <Text style={styles.summaryValue}>{formatNaira(DELIVERY_FEE)}</Text>",
    "            <Text style={styles.summaryLabel}>\n              {groups.length > 1 ? `Delivery fee (${groups.length} restaurants)` : 'Delivery fee'}\n            </Text>\n            <Text style={styles.summaryValue}>{formatNaira(deliveryTotal)}</Text>"
   ],
   [
    "const styles = StyleSheet.create({\n",
    "const styles = StyleSheet.create({\n  storeGroupGap: { marginTop: ms(10) },\n  storeHeaderRow: { backgroundColor: 'rgba(0,0,0,0.025)' },\n  storeFlex: { flex: 1, minWidth: 0 },\n  storeFootLabel: { flex: 1, marginTop: 0 },\n"
   ]
  ]
 },
 {
  "file": "app/fund-wallet-account.tsx",
  "marker": "hemera_complete_paid_order",
  "edits": [
   [
    "    // The database creates the order from the saved copy as soon as the payment lands,\n    // so it is usually there already.\n    const { data: existing } = await withTimeout(\n      supabase.from('orders').select('id').eq('metadata->>tx_ref', reference).limit(1),\n      'check existing order'\n    );\n    if (existing && existing.length > 0) return true;\n\n    const { error: insertError } = await withTimeout(supabase.from('orders').insert(row), 'insert into orders');\n\n    if (insertError) {\n      // Created by the database at the same moment: it's the same order.\n      if ((insertError as any).code === '23505') return true;\n",
    "    // The database makes the order(s) from the saved copy as soon as the payment lands\n    // (E-Chop: one order per restaurant). This finishes it if that didn't happen; it never doubles up.\n    const { data: result, error: rpcError } = await withTimeout(\n      supabase.rpc('hemera_complete_paid_order', {\n        p_tx_ref: reference,\n        p_order_type: row.order_type,\n        p_amount_kobo: row.total_kobo,\n        p_metadata: row.metadata,\n      }),\n      'complete order'\n    );\n    const insertError: { message: string } | null = rpcError\n      ? { message: rpcError.message }\n      : (result as any)?.ok === false\n        ? { message: String((result as any).error ?? 'The order could not be created.') }\n        : null;\n\n    if (insertError) {\n"
   ],
   [
    "        /payment_not_verified/.test(insertError.message)",
    "        /payment_not_verified|amount_short/.test(insertError.message)"
   ],
   [
    "          message: `Your E-Chop order #${ref} is confirmed and being prepared.`,",
    "          message:\n            Number(draft.metadata?.restaurants ?? 1) > 1\n              ? `Your order #${ref} is confirmed. Each of the ${draft.metadata.restaurants} restaurants is preparing its part.`\n              : `Your E-Chop order #${ref} is confirmed and being prepared.`,"
   ]
  ]
 },
 {
  "file": "src/hooks/useOrders.ts",
  "marker": "checkout_count",
  "edits": [
   [
    "\n  const totalNaira =\n    row.total_kobo != null ? Number(row.total_kobo) / 100 : Number(meta.total ?? 0);",
    "\n  // Restaurant orders from a checkout: show what the customer paid for this part.\n  const totalNaira =\n    meta.checkout_ref && meta.total != null\n      ? Number(meta.total)\n      : row.total_kobo != null\n        ? Number(row.total_kobo) / 100\n        : Number(meta.total ?? 0);"
   ],
   [
    "    meta: linesSummary(meta),\n",
    "    meta:\n      Number(meta.checkout_count) > 1\n        ? `${linesSummary(meta)} · ${meta.checkout_index} of ${meta.checkout_count} in #${meta.checkout_ref}`\n        : linesSummary(meta),\n"
   ]
  ]
 },
 {
  "file": "app/track-order.tsx",
  "marker": "loadSiblings",
  "edits": [
   [
    "  placedAt: string;\n};",
    "  placedAt: string;\n  checkoutRef?: string;\n};"
   ],
   [
    "    title: meta.title ?? 'Order',",
    "    title: meta.store_name ?? meta.title ?? 'Order',"
   ],
   [
    "    placedAt: data.created_at ?? new Date().toISOString(),\n",
    "    placedAt: data.created_at ?? new Date().toISOString(),\n    checkoutRef: meta.checkout_ref ?? undefined,\n"
   ],
   [
    "  const [order, setOrder] = useState<TrackedOrder | null>(null);\n",
    "  const [order, setOrder] = useState<TrackedOrder | null>(null);\n  // The other restaurant orders paid in the same checkout.\n  const [siblings, setSiblings] = useState<TrackedOrder[]>([]);\n"
   ],
   [
    "      query = UUID.test(directId)\n        ? query.eq('id', directId)\n        : query.eq('metadata->>ref', directId.toUpperCase());\n      const { data } = await query.maybeSingle();\n      if (cancelled) return;\n      if (data) {\n        setOrder(toTracked(data));\n        setAutoTracked(true);\n      }",
    "      const ref = directId.toUpperCase();\n      query = UUID.test(directId)\n        ? query.eq('id', directId)\n        : query.or(`metadata->>ref.eq.${ref},metadata->>checkout_ref.eq.${ref}`);\n      const { data: rows } = await query.order('created_at', { ascending: true }).limit(20);\n      if (cancelled) return;\n      const list = ((rows ?? []) as any[]).map(toTracked);\n      const first = list.find((o) => o.id.toUpperCase() === ref) ?? list[0];\n      if (first) {\n        setOrder(first);\n        setAutoTracked(true);\n        void loadSiblings(first);\n      }"
   ],
   [
    "          if (payload.new) setOrder(toTracked(payload.new));",
    "          if (payload.new) {\n            const t = toTracked(payload.new);\n            setOrder(t);\n            setSiblings((prev) => prev.map((s) => (s.rowId === t.rowId ? t : s)));\n          }"
   ],
   [
    "  const canSubmit =\n",
    "  const loadSiblings = async (o: TrackedOrder) => {\n    if (!o.checkoutRef) {\n      setSiblings([]);\n      return;\n    }\n    const { data } = await supabase\n      .from('orders')\n      .select('id, order_type, status, metadata, created_at')\n      .eq('metadata->>checkout_ref', o.checkoutRef)\n      .order('created_at', { ascending: true });\n    const list = ((data ?? []) as any[]).map(toTracked);\n    setSiblings(list.length > 1 ? list : []);\n  };\n\n  const canSubmit =\n"
   ],
   [
    "        .eq('metadata->>ref', cleanedRef)\n        .maybeSingle();",
    "        .or(`metadata->>ref.eq.${cleanedRef},metadata->>checkout_ref.eq.${cleanedRef}`)\n        .order('created_at', { ascending: true })\n        .limit(1)\n        .maybeSingle();"
   ],
   [
    "      setOrder(toTracked(data));\n    } catch",
    "      setOrder(toTracked(data));\n      void loadSiblings(toTracked(data));\n    } catch"
   ],
   [
    "  const reset = () => {\n    setOrder(null);\n",
    "  const reset = () => {\n    setOrder(null);\n    setSiblings([]);\n"
   ],
   [
    "              {order.cancelled && (\n",
    "              {siblings.length > 1 && (\n                <>\n                  <Text style={styles.sectionLabel}>RESTAURANTS IN THIS ORDER</Text>\n                  <View style={styles.siblingWrap}>\n                    {siblings.map((s) => {\n                      const active = s.rowId === order.rowId;\n                      const label = s.cancelled ? 'Cancelled' : s.steps[s.currentStepIndex]?.label ?? '';\n                      return (\n                        <TouchableOpacity\n                          key={s.rowId}\n                          style={[styles.siblingChip, active && styles.siblingChipActive]}\n                          onPress={() => setOrder(s)}\n                          activeOpacity={0.85}\n                        >\n                          <Text style={[styles.siblingName, active && styles.siblingTextActive]} numberOfLines={1}>\n                            {s.title}\n                          </Text>\n                          <Text style={[styles.siblingStatus, active && styles.siblingTextActive]} numberOfLines={1}>\n                            #{s.id} · {label}\n                          </Text>\n                        </TouchableOpacity>\n                      );\n                    })}\n                  </View>\n                </>\n              )}\n\n              {order.cancelled && (\n"
   ],
   [
    "const styles = StyleSheet.create({\n",
    "const styles = StyleSheet.create({\n  siblingWrap: { gap: ms(8), marginBottom: ms(6) },\n  siblingChip: {\n    borderWidth: 1,\n    borderColor: '#E8E3D0',\n    backgroundColor: '#fff',\n    borderRadius: ms(12),\n    paddingHorizontal: ms(14),\n    paddingVertical: ms(10),\n  },\n  siblingChipActive: { borderColor: foodColors.primary, backgroundColor: foodColors.primary },\n  siblingName: { fontSize: ms(13.5), fontFamily: fonts.poppins.semiBold, color: '#0B1020' },\n  siblingStatus: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: '#5F6B77', marginTop: ms(2) },\n  siblingTextActive: { color: '#fff' },\n"
   ]
  ]
 },
 {
  "file": "src/lib/orderStatus.ts",
  "marker": "accepted: 'approved'",
  "edits": [
   [
    "    confirmed: 'approved',\n    active:",
    "    confirmed: 'approved',\n    // Set by the partner app (restaurants and laundries).\n    accepted: 'approved',\n    processing: ewash ? 'processing' : 'preparing',\n    'pickup-received': 'picked-up',\n    'ready-for-dispatch': 'ready',\n    'out-for-delivery': 'out-for-delivery',\n    active:"
   ],
   [
    "const CANCELLED_STATUSES = ['cancel', 'cancelled', 'canceled', 'failed', 'rejected', 'refunded'];",
    "const CANCELLED_STATUSES = ['cancel', 'cancelled', 'canceled', 'cancelled_by_vendor', 'failed', 'rejected', 'refunded'];"
   ]
  ]
 },
 {
  "file": "app/track-order.tsx",
  "marker": "overallText",
  "edits": [
   [
    "    confirmed: 'approved',\n    active: type === 'echop' ? 'preparing' : 'processing',",
    "    confirmed: 'approved',\n    // Set by the partner app (restaurants and laundries).\n    accepted: 'approved',\n    processing: type === 'echop' ? 'preparing' : 'processing',\n    'pickup-received': 'picked-up',\n    'ready-for-dispatch': 'ready',\n    active: type === 'echop' ? 'preparing' : 'processing',"
   ],
   [
    "const CANCELLED = new Set(['cancelled', 'canceled', 'cancel', 'failed', 'rejected', 'refunded']);",
    "const CANCELLED = new Set(['cancelled', 'canceled', 'cancel', 'cancelled_by_vendor', 'failed', 'rejected', 'refunded']);"
   ],
   [
    "function formatDate(iso: string) {",
    "/** One line about all the restaurants in a checkout, e.g. \"2 of 3 restaurants have your food ready\". */\nfunction overallText(list: TrackedOrder[]) {\n  const live = list.filter((o) => !o.cancelled);\n  const n = live.length;\n  if (n === 0) return 'These orders were cancelled.';\n  const at = (key: string) => live.filter((o) => o.currentStepIndex >= o.steps.findIndex((s) => s.key === key)).length;\n  const delivered = at('delivered');\n  if (delivered === n) return 'Everything has been delivered.';\n  if (delivered > 0) return `${delivered} of ${n} restaurants delivered.`;\n  const onTheWay = at('picked-up');\n  if (onTheWay > 0) return `Hemera's rider has collected from ${onTheWay} of ${n} restaurants.`;\n  const ready = at('ready');\n  return `${ready} of ${n} restaurants have your food ready. Hemera's rider collects it and brings it to you.`;\n}\n\nfunction formatDate(iso: string) {"
   ],
   [
    "                  <Text style={styles.sectionLabel}>RESTAURANTS IN THIS ORDER</Text>\n",
    "                  <Text style={styles.sectionLabel}>RESTAURANTS IN THIS ORDER</Text>\n                  <Text style={styles.siblingOverall}>{overallText(siblings)}</Text>\n"
   ],
   [
    "const styles = StyleSheet.create({\n",
    "const styles = StyleSheet.create({\n  siblingOverall: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: '#5F6B77', marginBottom: ms(8) },\n"
   ]
  ]
 },
 {
  "file": "app/track-order.tsx",
  "marker": "at_laundry",
  "edits": [
   [
    "  { key: 'picked-up', label: 'Picked Up', description: 'Your laundry has been picked up.', icon: 'truck', color: '#4A90E2' },\n",
    "  { key: 'picked-up', label: 'Picked Up', description: 'Your laundry has been picked up.', icon: 'truck', color: '#4A90E2' },\n  { key: 'at-laundry', label: 'At the Laundry', description: 'Your laundry is with the laundry partner.', icon: 'store', color: '#4A90E2' },\n"
   ],
   [
    "    'ready-for-dispatch': 'ready',\n    active: type === 'echop' ? 'preparing' : 'processing',",
    "    'ready-for-dispatch': 'ready',\n    at_laundry: 'at-laundry',\n    handed_over: 'picked-up',\n    active: type === 'echop' ? 'preparing' : 'processing',"
   ],
   [
    "const CANCELLED = new Set(['cancelled', 'canceled', 'cancel', 'cancelled_by_vendor', 'failed', 'rejected', 'refunded']);",
    "const CANCELLED = new Set(['cancelled', 'canceled', 'cancel', 'cancelled_by_vendor', 'failed', 'rejected', 'refunded', 'timed_out']);"
   ]
  ]
 },
 {
  "file": "app/order-details.tsx",
  "marker": "at-laundry",
  "edits": [
   [
    "    { key: 'picked-up', title: 'Picked Up', description: 'Your laundry has been picked up.', icon: 'truck' },\n",
    "    { key: 'picked-up', title: 'Picked Up', description: 'Your laundry has been picked up.', icon: 'truck' },\n    { key: 'at-laundry', title: 'At the Laundry', description: 'Your laundry is with the laundry partner.', icon: 'store' },\n"
   ]
  ]
 },
 {
  "file": "src/lib/orderStatus.ts",
  "marker": "timed_out",
  "edits": [
   [
    "    'ready-for-dispatch': 'ready',\n",
    "    'ready-for-dispatch': 'ready',\n    'handed-over': 'picked-up',\n"
   ],
   [
    "const CANCELLED_STATUSES = ['cancel', 'cancelled', 'canceled', 'cancelled_by_vendor', 'failed', 'rejected', 'refunded'];",
    "const CANCELLED_STATUSES = ['cancel', 'cancelled', 'canceled', 'cancelled_by_vendor', 'failed', 'rejected', 'refunded', 'timed_out'];"
   ]
  ]
 },
 {
  "file": "src/hooks/useOrders.ts",
  "marker": "case 'timed_out'",
  "edits": [
   [
    "\n    case 'rejected':\n    case 'refunded':\n      return 'Cancelled';",
    "\n    case 'rejected':\n    case 'refunded':\n    case 'timed_out':\n      return 'Cancelled';"
   ]
  ]
 },
 {
  "file": "app/wallet.tsx",
  "marker": "ORDER-REFUND-",
  "edits": [
   [
    "type ActivityKind = 'funded' | 'locked' | 'refund' | 'withdrawal' | 'other';",
    "type ActivityKind = 'funded' | 'locked' | 'refund' | 'order_refund' | 'withdrawal' | 'other';"
   ],
   [
    "  if (ref.startsWith('EPLAN-REFUND-')) return 'refund';",
    "  if (ref.startsWith('EPLAN-REFUND-')) return 'refund';\n  // Food the restaurant didn't accept or rejected: refunded automatically.\n  if (ref.startsWith('ORDER-REFUND-')) return 'order_refund';"
   ],
   [
    "    case 'refund':\n",
    "    case 'order_refund':\n      return { icon: 'arrow-down', iconBg: 'rgba(52,199,89,0.12)', iconColor: foodColors.success, title: 'Order Refund', amountColor: foodColors.success, sign: '+' };\n    case 'refund':\n"
   ],
   [
    "    return kind === 'funded' || kind === 'withdrawal';",
    "    return kind === 'funded' || kind === 'withdrawal' || kind === 'order_refund';"
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
