import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import type {
  MenuItem,
  Partner,
  PartnerDetail,
  PartnerReview,
} from '../constants/foodData';

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function toPartner(row: any): Partner {
  return {
    id: row.id,
    name: row.name,
    rating: Number(row.rating),
    etaMinutes: row.eta_minutes,
    image: row.image_url ?? '',
    logo: { uri: row.logo_url ?? '' },
  };
}

function toMenuItem(row: any, partnerName: string): MenuItem {
  return {
    id: row.id,
    partnerName: partnerName.toUpperCase(),
    isPopular: row.is_popular,
    name: row.name,
    description: row.description ?? '',
    price: row.price,
    rating: Number(row.rating),
    etaMinutes: row.eta_minutes,
    image: row.image_url ?? '',
  };
}

function toReview(row: any): PartnerReview {
  return {
    id: row.id,
    author: row.author,
    initials: initialsOf(row.author),
    rating: row.rating,
    date: timeAgo(row.created_at),
    comment: row.comment ?? '',
  };
}

function toPartnerDetail(row: any): PartnerDetail {
  return {
    ...toPartner(row),
    tagline: row.tagline ?? '',
    cuisine: row.cuisine ?? '',
    address: row.address ?? '',
    distanceKm: Number(row.distance_km ?? 0),
    priceLevel: '₦',
    openNow: row.open_now,
    hours: row.hours ?? '',
    reviewCount: row.review_count ?? 0,
    categories: [...(row.menu_categories ?? [])]
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((c: any) => ({
        id: c.id,
        title: c.title,
        items: (c.menu_items ?? []).map((i: any) => toMenuItem(i, row.name)),
      }))
      .filter((c: any) => c.items.length > 0),
    reviews: [...(row.partner_reviews ?? [])]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(toReview),
  };
}

function useSupabaseQuery<T>(fetcher: () => Promise<T>, initial: T, deps: unknown[]) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcher()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error };
}

export function usePartners() {
  const { data, loading, error } = useSupabaseQuery<Partner[]>(
    async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw new Error(error.message);
      return data.map(toPartner);
    },
    [],
    []
  );
  return { partners: data, loading, error };
}

export function usePartnerDetail(id: string | undefined) {
  const { data, loading, error } = useSupabaseQuery<PartnerDetail | null>(
    async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('partners')
        .select('*, menu_categories(id, title, sort_order, menu_items(*)), partner_reviews(*)')
        .eq('id', id)
        .eq('menu_categories.menu_items.is_available', true)
        .single();
      if (error) throw new Error(error.message);
      return toPartnerDetail(data);
    },
    null,
    [id]
  );
  return { partner: data, loading, error };
}

export function useTodaysMenu() {
  const { data, loading, error } = useSupabaseQuery<MenuItem[]>(
    async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, partners(name)')
        .eq('is_available', true)
        .not('todays_pick_order', 'is', null)
        .order('todays_pick_order', { ascending: true });
      if (error) throw new Error(error.message);
      return data.map((row: any) => toMenuItem(row, row.partners?.name ?? ''));
    },
    [],
    []
  );
  return { items: data, loading, error };
}

export function useAllMenuItems() {
  const { data, loading, error } = useSupabaseQuery<MenuItem[]>(
    async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, partners(name)')
        .eq('is_available', true);
      if (error) throw new Error(error.message);
      return data.map((row: any) => toMenuItem(row, row.partners?.name ?? ''));
    },
    [],
    []
  );
  return { items: data, loading, error };
}