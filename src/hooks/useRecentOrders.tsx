import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { normalizeStatus, isCancelledStatus } from '../lib/orderStatus';

export type RecentOrder = {
  id: string;
  ref?: string;
  rawStatus: string;
  stage: string;
  stageLabel: string;
  summary: string;
  activityAt: string;
  activityLabel: string;
  isActive: boolean;
  coveredByPlan: boolean;
  isSubscription: boolean;
};

const STAGE_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  'picked-up': 'Picked Up',
  processing: 'Processing',
  ready: 'Ready',
  'out-for-delivery': 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function labelFor(stage: string) {
  if (STAGE_LABELS[stage]) return STAGE_LABELS[stage];
  return stage.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

function activityLabel(iso: string) {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === new Date().toDateString()) return `Today, ${time}`;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function summaryOf(meta: Record<string, any>, fallback: string) {
  const count = Array.isArray(meta.lines)
    ? meta.lines.reduce((sum: number, l: any) => sum + (Number(l?.qty) || 1), 0)
    : Number(meta.items) || 0;
  if (count) return `${count} item${count === 1 ? '' : 's'}`;
  return meta.title ? String(meta.title).split(' · ')[0] : fallback;
}

export function useRecentOrders(type: 'ewash' | 'echop' = 'ewash', limit = 5) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [rows, setRows] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from('orders')
      .select('id, status, metadata, created_at, status_updated_at')
      .eq('user_id', userId)
      .eq('order_type', type)
      .order('created_at', { ascending: false })
      .limit(60);

    if (queryError) {
      setError(queryError.message);
    } else {
      const mapped = (data ?? [])
        .map((r: any): RecentOrder | null => {
          const meta = (r.metadata ?? {}) as Record<string, any>;

          // Subscription purchases are payments, not order activity.
          if (meta.kind === 'subscription') return null;

          const raw = String(r.status ?? '');
          const cancelled = isCancelledStatus(raw);
          const stage = cancelled ? 'cancelled' : normalizeStatus(raw, type);
          const at = r.status_updated_at ?? r.created_at;

          return {
            id: r.id,
            ref: meta.ref ? String(meta.ref) : undefined,
            rawStatus: raw,
            stage,
            stageLabel: labelFor(stage),
            summary: summaryOf(meta, type === 'ewash' ? 'E-Wash Order' : 'E-Chop Order'),
            activityAt: at,
            activityLabel: activityLabel(at),
            isActive: !cancelled && stage !== 'delivered',
            coveredByPlan: meta.covered_by_plan === true || meta.covered_by_plan === 'true',
            isSubscription: false,
          };
        })
        .filter((o): o is RecentOrder => o !== null);

      mapped.sort(
        (a, b) => new Date(b.activityAt).getTime() - new Date(a.activityAt).getTime()
      );
      setRows(mapped);
      setError(null);
    }
    setLoading(false);
  }, [userId, type]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const orders = useMemo(() => rows.slice(0, limit), [rows, limit]);

  // All active orders, most recently updated first. Chevrons scroll through these.
  const activeOrders = useMemo(() => rows.filter((o) => o.isActive), [rows]);

  // Kept for existing screens that only want the single newest active order.
  const activeOrder = activeOrders[0] ?? null;

  return { orders, activeOrders, activeOrder, loading, error, refetch: load };
}