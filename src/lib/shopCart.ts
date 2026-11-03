// Our Products cart (Hemera's own shop). Separate from the E-Chop cart.
// Saved on the phone, cleared when another account signs in.
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useOnUserChange } from '../hooks/useOnUserChange';

export type ShopProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_kobo: number;
  image_url: string | null;
  in_stock: boolean;
  stock_qty: number | null;
  created_at?: string;
};

export type ShopLine = { product: ShopProduct; qty: number };

const KEY = 'shop:cart';
let lines: ShopLine[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
  AsyncStorage.setItem(KEY, JSON.stringify(lines)).catch(() => {});
}
function set(next: ShopLine[]) {
  lines = next;
  emit();
}
async function hydrate() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.length && lines.length === 0) {
      lines = parsed.filter((l: any) => l?.product?.id && l.qty > 0);
      for (const l of listeners) l();
    }
  } catch {}
}

const maxQty = (p: ShopProduct) => Math.min(50, p.stock_qty ?? 50);

export const shopCart = {
  add(product: ShopProduct, qty = 1) {
    const i = lines.findIndex((l) => l.product.id === product.id);
    if (i === -1) set([...lines, { product, qty: Math.min(qty, maxQty(product)) }]);
    else set(lines.map((l, j) => (j === i ? { product, qty: Math.min(l.qty + qty, maxQty(product)) } : l)));
  },
  setQty(id: string, qty: number) {
    if (qty <= 0) set(lines.filter((l) => l.product.id !== id));
    else set(lines.map((l) => (l.product.id === id ? { ...l, qty: Math.min(qty, maxQty(l.product)) } : l)));
  },
  remove(id: string) {
    set(lines.filter((l) => l.product.id !== id));
  },
  clear() {
    set([]);
  },
  /** Replace cart products with the latest prices / stock; drop ones that are gone. */
  refresh(latest: ShopProduct[]) {
    const by = new Map(latest.map((p) => [p.id, p]));
    const next = lines.filter((l) => by.has(l.product.id)).map((l) => ({ product: by.get(l.product.id)!, qty: l.qty }));
    if (JSON.stringify(next) !== JSON.stringify(lines)) set(next);
  },
};

export function useShopCart() {
  useEffect(() => { hydrate(); }, []);
  useOnUserChange(() => shopCart.clear());
  const subscribe = useCallback((cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; }, []);
  const current = useSyncExternalStore(subscribe, () => lines, () => lines);
  return useMemo(() => {
    const itemCount = current.reduce((s, l) => s + l.qty, 0);
    const totalKobo = current.reduce((s, l) => s + l.qty * l.product.price_kobo, 0);
    const qtyOf = (id: string) => current.find((l) => l.product.id === id)?.qty ?? 0;
    return { lines: current, itemCount, totalKobo, qtyOf, ...shopCart };
  }, [current]);
}

export async function fetchShopProducts(): Promise<ShopProduct[]> {
  const { data, error } = await supabase
    .from('shop_products')
    .select('id, name, description, category, price_kobo, image_url, in_stock, stock_qty, created_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((p) => ({ ...p, price_kobo: Number(p.price_kobo) }));
}

export const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString()}`;

/** Message from a database error like "out_of_stock: Iron is out of stock." */
export function shopError(message: string | undefined): string {
  const m = String(message ?? '');
  return m.includes(':') ? m.split(':').slice(1).join(':').trim() : m || 'Something went wrong. Please try again.';
}
