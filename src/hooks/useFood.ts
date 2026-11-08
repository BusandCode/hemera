import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { supabase } from '../lib/supabase';
import { categories as FOOD_TABS } from '../constants/foodData';
import type { MenuItem, Partner, PartnerDetail, PartnerReview } from '../constants/foodData';

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
    isPopular: popularIds.has(p.id),   // a best seller of the last 30 days
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

type Rating = { rating: number; reviews: number };

/** Average rating and number of reviews per restaurant (store id). */
// "Popular" = the best-selling meals of the last 30 days (at least 3 sold), from real orders.
// Refreshed together with the ratings, which every menu loader fetches before building meals.
let popularIds = new Set<string>();

async function loadPopular(): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('hemera_popular_products', { p_days: 30, p_limit: 20, p_min: 3 });
    if (!error && Array.isArray(data)) popularIds = new Set((data as any[]).map((r) => String(r.product_id)));
  } catch {}
}

async function loadRatings(): Promise<Map<string, Rating>> {
  const m = new Map<string, Rating>();
  try {
    const [{ data, error }] = await Promise.all([supabase.rpc('hemera_store_ratings'), loadPopular()]);
    if (error || !Array.isArray(data)) return m;
    for (const r of data as any[]) {
      m.set(String(r.store_id), { rating: Number(r.rating) || 0, reviews: Number(r.reviews) || 0 });
    }
  } catch {}
  return m;
}

function initialsOf(name: string | null | undefined) {
  const parts = String(name ?? '').replace(/\./g, '').trim().split(/\s+/).filter(Boolean);
  return (parts.map((p) => p[0]).join('').slice(0, 2) || 'C').toUpperCase();
}

/** Latest reviews of one restaurant. */
async function loadReviews(storeId: string): Promise<PartnerReview[]> {
  const { data, error } = await supabase
    .from('store_reviews')
    .select('id, rating, comment, author_name, reply, created_at')
    .eq('store_id', storeId)
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) return [];
  return ((data ?? []) as any[]).map((r) => ({
    id: String(r.id),
    author: r.author_name ?? 'Customer',
    initials: initialsOf(r.author_name),
    rating: Number(r.rating) || 0,
    date: new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    comment: r.comment ?? '',
    reply: r.reply ?? undefined,
  }));
}

/** All in-stock meals from approved stores, newest first. */
async function loadMenu(): Promise<MenuItem[]> {
  const stores = await loadStores();
  const byId = new Map(stores.map((s) => [s.id, s]));
  const [products, ratings] = await Promise.all([loadProducts(stores.map((s) => s.id)), loadRatings()]);
  return products
    .map((p) => ({
      ...toMenuItem(p, byId.get(p.store_id)?.name ?? '', byId.get(p.store_id)?.canOrder === false),
      rating: ratings.get(p.store_id)?.rating ?? 0,   // the restaurant's rating
    }))
    .sort((a, b) => Number(!!a.closed) - Number(!!b.closed));   // meals you can order first
}

const REFRESH_EVERY_MS = 20_000;

// Everything on the E-Chop screens that loads restaurants or meals registers here, so a
// pull-to-refresh (or coming back to the screen) can reload all of it at once.
const reloaders = new Set<() => Promise<void>>();

/** Reload restaurants and meals everywhere. Resolves when all of them are done. */
export function refreshFoodData(): Promise<void> {
  return Promise.all(Array.from(reloaders).map((r) => r())).then(() => undefined);
}

// Live updates: when a restaurant, product or review changes (e.g. Hemera approves a product,
// a restaurant opens), reload while an E-Chop screen is open. One shared connection.
let liveFoodChannel: ReturnType<typeof supabase.channel> | null = null;
let liveFoodTimer: ReturnType<typeof setTimeout> | null = null;
function startLiveFood() {
  if (liveFoodChannel) return;
  const kick = () => {
    if (liveFoodTimer) return;
    liveFoodTimer = setTimeout(() => {
      liveFoodTimer = null;
      void refreshFoodData();
    }, 800);
  };
  const ch = supabase.channel('live-food');
  for (const table of ['stores', 'products', 'store_reviews']) {
    ch.on('postgres_changes' as any, { event: '*', schema: 'public', table }, kick);
  }
  ch.subscribe();
  liveFoodChannel = ch;
}
function stopLiveFoodIfIdle() {
  if (reloaders.size > 0 || !liveFoodChannel) return;
  supabase.removeChannel(liveFoodChannel);
  liveFoodChannel = null;
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
    startLiveFood();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') run();
    }, REFRESH_EVERY_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') run();
    });
    return () => {
      cancelled = true;
      reloaders.delete(run);
      stopLiveFoodIfIdle();
      clearInterval(timer);
      sub.remove();
    };
  }, deps);

  return { data, loading, error };
}

/** Every approved restaurant in the service area shows; closed ones (or ones with no menu yet) show as Closed. */
export function usePartners() {
  const { data, loading, error } = useSupabaseQuery<Partner[]>(
    async () => {
      const stores = await loadStores();
      const [products, ratings] = await Promise.all([loadProducts(stores.map((s) => s.id)), loadRatings()]);
      const byStore = new Map<string, ProductRow[]>();
      for (const p of products) byStore.set(p.store_id, [...(byStore.get(p.store_id) ?? []), p]);
      return stores
        .map((s) => (byStore.has(s.id) ? s : { ...s, canOrder: false }))   // no menu yet = can't order
        .sort((a, b) => Number(b.canOrder !== false) - Number(a.canOrder !== false))
        .map((s) => ({ ...toPartner(s, byStore.get(s.id) ?? []), rating: ratings.get(s.id)?.rating ?? 0 }));
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
      const [products, ratings, reviews] = await Promise.all([
        loadProducts([store.id]),
        loadRatings(),
        loadReviews(store.id),
      ]);
      const items = products.map((p) => toMenuItem(p, store.name, store.canOrder === false));
      return {
        ...toPartner(store, products),
        rating: ratings.get(store.id)?.rating ?? 0,
        tagline: store.description ?? '',
        // Set by the partner on their store: e.g. "Nigerian · Rice · Grills".
        cuisine: (store.cuisines ?? []).join(' · ') || 'E-Chop',
        address: store.address ?? '',
        distanceKm: 0,
        // ₦, ₦₦ or ₦₦₦, chosen by the partner (the screen shows it as text).
        priceLevel: (store.price_level || '₦') as '₦',
        openNow: store.canOrder !== false,
        hours: store.hours ?? '',
        reviewCount: ratings.get(store.id)?.reviews ?? 0,
        categories: groupByCategory(items),
        reviews,
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
