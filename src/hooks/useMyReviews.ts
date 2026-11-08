// The signed-in customer's reviews for a set of orders (from the database), so lists can show
// "Rate now" or "Reviewed ★4". Reloads whenever the screen comes back into view.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';

export type MyReview = { rating: number; comment: string | null };

export function useMyReviews(orderIds: string[]) {
  const key = useMemo(() => [...orderIds].sort().join(','), [orderIds]);
  const [reviews, setReviews] = useState<Map<string, MyReview>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const alive = useRef(true);

  const load = useCallback(async () => {
    const ids = key ? key.split(',') : [];
    if (!ids.length) { setReviews(new Map()); setLoaded(true); return; }
    const { data, error } = await supabase.rpc('hemera_my_reviews', { p_order_ids: ids });
    if (!alive.current) return;
    if (!error && Array.isArray(data)) {
      setReviews(new Map((data as any[]).map((r) => [String(r.order_id), { rating: Number(r.rating) || 0, comment: r.comment ?? null }])));
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => { alive.current = true; void load(); return () => { alive.current = false; }; }, [load]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return { reviews, loaded, reload: load };
}
