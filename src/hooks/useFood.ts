import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { supabase } from '../lib/supabase';
import { categories as FOOD_TABS } from '../constants/foodData';
import type { MenuItem, Partner, PartnerDetail } from '../constants/foodData';

// E-Chop restaurants and meals come from the partner tables:
//   stores   = a partner's restaurant (only approved, not deleted)
//   products = its menu (only in stock)
// The database also hides unapproved stores and out-of-stock products from customers,
// so the filters below are a second safety net.

const STORE_COLUMNS =
  'id, name, description, address, hours, hours_schedule, logo_url, cover_url, cuisines, price_level, created_at';
const PRODUCT_COLUMNS =
  'id, store_id, name, description, category, price_kobo, in_stock, image_url, eta_minutes, created_at';

const DEFAULT_ETA = 30;
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

type StoreRow = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  hours: string | null;
  hours_schedule: Record<string, { open?: boolean; from?: string; to?: string }> | null;
  logo_url: string | null;
  cover_url: string | null;
  cuisines: string[] | null;
  price_level: string | null;
  created_at: string;
  /** Set by loadStores: true when the restaurant can take orders right now (open and not paused). */
  canOrder?: boolean;
};

type ProductRow = {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_kobo: number | null;
  in_stock: boolean;
  image_url: string | null;
  eta_minutes: number | null;
  created_at: string;
};

function toMinutes(t: string | undefined) {
  if (!t || !/^\d{2}:\d{2}$/.test(t)) return null;
  return Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
}

/** Open right now, using the store's weekly hours (overnight hours supported). */
function isOpenNow(schedule: StoreRow['hours_schedule'], now = new Date()) {
  if (!schedule) return true;
  // Opening hours are in Nigeria time (UTC+1, no daylight saving), whatever the phone's time zone.
  const lagos = new Date(now.getTime() + 60 * 60 * 1000);
  const minutes = lagos.getUTCHours() * 60 + lagos.getUTCMinutes();
  const today = schedule[DAY_KEYS[lagos.getUTCDay()]];
  const yesterday = schedule[DAY_KEYS[(lagos.getUTCDay() + 6) % 7]];

  const inside = (d: typeof today, part: 'same-day' | 'after-midnight') => {
    if (!d?.open) return false;
    const from = toMinutes(d.from);
    const to = toMinutes(d.to);
    if (from == null || to == null || from === to) return false;
    const overnight = to < from;
    if (part === 'same-day') return overnight ? minutes >= from : minutes >= from && minutes < to;
    return overnight && minutes < to;
  };

  return inside(today, 'same-day') || inside(yesterday, 'after-midnight');
}

function toMenuItem(p: ProductRow, storeName: string, closed = false): MenuItem {
  return {
    closed,
    id: p.id,
    partnerName: storeName.toUpperCase(),
    storeId: p.store_id,
    storeName,
    isPopular: false,
    name: p.name,
    description: p.description ?? '',
    price: Math.round(Number(p.price_kobo ?? 0) / 100),
    rating: 0,
    etaMinutes: p.eta_minutes ?? DEFAULT_ETA,
    image: p.image_url ?? '',
    category: p.category ?? undefined,
  };
}

function toPartner(s: StoreRow, products: ProductRow[]): Partner {
  const etas = products.map((p) => p.eta_minutes).filter((n): n is number => typeof n === 'number');
  // Background image: the partner's cover photo, else their logo, else a product photo.
  const cover = s.cover_url || s.logo_url || products.find((p) => p.image_url)?.image_url || '';
  return {
    closed: s.canOrder === false,
    cuisine: (s.cuisines ?? []).join(' · '),
    id: s.id,
    name: s.name,
    rating: 0,
    etaMinutes: etas.length ? Math.min(...etas) : DEFAULT_ETA,
    image: cover,
    logo: { uri: s.logo_url || cover },
  };
}

/** Category sections in the same order as the customer category tabs. */
function groupByCategory(items: MenuItem[]) {
  const order = FOOD_TABS.filter((c) => c !== 'All') as string[];
  const groups = new Map<string, MenuItem[]>();
  for (const it of items) {
    const key = it.category?.trim() || 'Other';
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  const rank = (k: string) => {
    const i = order.findIndex((c) => c.toLowerCase() === k.toLowerCase());
    return i === -1 ? order.length : i;
  };
  return [...groups.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]))
    .map(([title, list]) => ({ id: title, title, items: list }));
}

async function loadStores(storeId?: string): Promise<StoreRow[]> {
  let q = supabase
    .from('stores')
    .select(STORE_COLUMNS)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (storeId) q = q.eq('id', storeId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const stores = (data ?? []) as StoreRow[];
  // Every approved restaurant is shown. Opening hours (and "Accepting orders") only decide
  // whether it can take an order right now; closed ones show as "Closed" and can't be added to.
  const open = await orderableStoreIds();
  return stores
    .map((s) => ({ ...s, canOrder: open ? open.has(s.id) : isOpenNow(s.hours_schedule) }))
    .sort((a, b) => Number(b.canOrder) - Number(a.canOrder));   // open ones first
}

/** Stores customers can order from right now (open by their hours and not paused). Null if the check fails. */
async function orderableStoreIds(): Promise<Set<string> | null> {
  const { data, error } = await supabase.rpc('hemera_orderable_store_ids');
  if (error || !Array.isArray(data)) return null;
  return new Set(
    (data as unknown[]).map((r) => String(r && typeof r === 'object' ? Object.values(r as object)[0] : r))
  );
}

async function loadProducts(storeIds: string[]): Promise<ProductRow[]> {
  if (storeIds.length === 0) return [];
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .in('store_id', storeIds)
    .eq('in_stock', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRow[];
}

/** All in-stock meals from approved stores, newest first. */
async function loadMenu(): Promise<MenuItem[]> {
  const stores = await loadStores();
  const byId = new Map(stores.map((s) => [s.id, s]));
  const products = await loadProducts(stores.map((s) => s.id));
  return products
    .map((p) => toMenuItem(p, byId.get(p.store_id)?.name ?? '', byId.get(p.store_id)?.canOrder === false))
    .sort((a, b) => Number(!!a.closed) - Number(!!b.closed));   // meals you can order first
}

const REFRESH_EVERY_MS = 60_000;

// Everything on the E-Chop screens that loads restaurants or meals registers here, so a
// pull-to-refresh (or coming back to the screen) can reload all of it at once.
const reloaders = new Set<() => Promise<void>>();

/** Reload restaurants and meals everywhere. Resolves when all of them are done. */
export function refreshFoodData(): Promise<void> {
  return Promise.all(Array.from(reloaders).map((r) => r())).then(() => undefined);
}

function useSupabaseQuery<T>(fetcher: () => Promise<T>, initial: T, deps: unknown[]) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let first = true;
    let running: Promise<void> | null = null;

    // Loads now, then again every minute, when the app comes back to the front, and on
    // pull-to-refresh. Only the first load shows the spinner; later ones update quietly.
    const run = (): Promise<void> => {
      if (running) return running;
      if (first) setLoading(true);
      running = fetcher()
        .then((result) => {
          if (cancelled) return;
          setData(result);
          setError(null);
        })
        .catch((e: Error) => {
          if (!cancelled) setError(e.message);
        })
        .finally(() => {
          running = null;
          if (!cancelled && first) setLoading(false);
          first = false;
        });
      return running;
    };

    run();
    reloaders.add(run);
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') run();
    }, REFRESH_EVERY_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') run();
    });
    return () => {
      cancelled = true;
      reloaders.delete(run);
      clearInterval(timer);
      sub.remove();
    };
  }, deps);

  return { data, loading, error };
}

/** Restaurants that have at least one meal customers can order. */
export function usePartners() {
  const { data, loading, error } = useSupabaseQuery<Partner[]>(
    async () => {
      const stores = await loadStores();
      const products = await loadProducts(stores.map((s) => s.id));
      const byStore = new Map<string, ProductRow[]>();
      for (const p of products) byStore.set(p.store_id, [...(byStore.get(p.store_id) ?? []), p]);
      return stores
        .filter((s) => byStore.has(s.id))
        .map((s) => toPartner(s, byStore.get(s.id) ?? []));
    },
    [],
    []
  );
  return { partners: data, loading, error };
}

/** One restaurant with its menu grouped by category. `id` is the store id. */
export function usePartnerDetail(id: string | undefined) {
  const { data, loading, error } = useSupabaseQuery<PartnerDetail | null>(
    async () => {
      if (!id) return null;
      const [store] = await loadStores(id);
      if (!store) throw new Error('This restaurant is not available right now.');
      const products = await loadProducts([store.id]);
      const items = products.map((p) => toMenuItem(p, store.name, store.canOrder === false));
      return {
        ...toPartner(store, products),
        tagline: store.description ?? '',
        // Set by the partner on their store: e.g. "Nigerian · Rice · Grills".
        cuisine: (store.cuisines ?? []).join(' · ') || 'E-Chop',
        address: store.address ?? '',
        distanceKm: 0,
        // ₦, ₦₦ or ₦₦₦, chosen by the partner (the screen shows it as text).
        priceLevel: (store.price_level || '₦') as '₦',
        openNow: store.canOrder !== false,
        hours: store.hours ?? '',
        reviewCount: 0,
        categories: groupByCategory(items),
        reviews: [],
      };
    },
    null,
    [id]
  );
  return { partner: data, loading, error };
}

export function useTodaysMenu() {
  const { data, loading, error } = useSupabaseQuery<MenuItem[]>(loadMenu, [], []);
  return { items: data, loading, error };
}

export function useAllMenuItems() {
  const { data, loading, error } = useSupabaseQuery<MenuItem[]>(loadMenu, [], []);
  return { items: data, loading, error };
}
