// import { useCallback, useState } from 'react';
// import { useFocusEffect } from 'expo-router';

// import { supabase } from '../lib/supabase';
// import { useAuth } from '../context/AuthContext';
// import type { Order } from '../components/profile/OrderCard';

// type OrderStatus = Order['status'];

// type OrderRow = {
//   id: string;
//   order_type: string | null;
//   status: string | null;
//   total_kobo: number | string | null;
//   metadata: Record<string, any> | null;
//   created_at: string;
// };

// function normalizeType(raw: string | null): Order['type'] {
//   return raw === 'ewash' ? 'ewash' : 'echop';
// }

// function normalizeStatus(raw: string | null): OrderStatus {
//   switch ((raw ?? '').toLowerCase().trim()) {
//     case 'delivered':
//     case 'completed':
//     case 'complete':
//     case 'fulfilled':
//       return 'Delivered';
//     case 'cancelled':
//     case 'canceled':
//     case 'failed':
//     case 'rejected':
//     case 'refunded':
//       return 'Cancelled';
//     case 'scheduled':
//       return 'Scheduled';
//     default:
//       return 'In Progress';
//   }
// }

// export type OrderScope = 'all' | 'active' | 'finished';

// const ACTIVE_STATUSES: OrderStatus[] = ['In Progress', 'Scheduled'];
// const FINISHED_STATUSES: OrderStatus[] = ['Delivered', 'Cancelled'];

// function formatDate(iso: string) {
//   const d = new Date(iso);
//   const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
//   if (d.toDateString() === new Date().toDateString()) return `Today, ${time}`;
//   return d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
// }

// function splitTitle(raw: string | undefined, fallback: string) {
//   if (!raw) return { title: fallback, rest: '' };
//   const index = raw.indexOf(' · ');
//   if (index === -1) return { title: raw, rest: '' };
//   return { title: raw.slice(0, index), rest: raw.slice(index + 3) };
// }

// function linesSummary(meta: Record<string, any>) {
//   const count = Array.isArray(meta.lines)
//     ? meta.lines.reduce((sum: number, l: any) => sum + (Number(l?.qty) || 1), 0)
//     : Number(meta.items) || 0;
//   return count ? `${count} item${count === 1 ? '' : 's'}` : '';
// }

// function toOrder(row: OrderRow): Order {
//   const type = normalizeType(row.order_type);
//   const status = normalizeStatus(row.status);
//   const meta = row.metadata ?? {};
//   const { title, rest } = splitTitle(
//     meta.title,
//     type === 'echop' ? 'E-Chop Order' : 'E-Wash Order'
//   );

//   const totalNaira =
//     row.total_kobo != null ? Number(row.total_kobo) / 100 : Number(meta.total ?? 0);

//   const useEta = (status === 'In Progress' || status === 'Scheduled') && typeof meta.eta === 'string';

//   return {
//     id: row.id,
//     type,
//     title,
//     meta: rest || linesSummary(meta),
//     date: useEta ? meta.eta : formatDate(row.created_at),
//     amount: Math.round(totalNaira),
//     status,
//     ref: meta.ref ? String(meta.ref) : undefined,
//     rawStatus: row.status ?? '',
//   };
// }

// /**
//  * type:  limit to one service ('echop' | 'ewash'), or omit for both.
//  * scope: 'active'   → In Progress / Scheduled (My Orders)
//  *        'finished' → Delivered / Cancelled (E-Wash Orders)
//  *        'all'      → everything, newest first (Order History, default)
//  */
// export function useOrders(type?: Order['type'], scope: OrderScope = 'all') {
//   const { session } = useAuth();
//   const userId = session?.user.id;
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const load = useCallback(async () => {
//     if (!userId) {
//       setOrders([]);
//       setLoading(false);
//       return;
//     }

//     const { data, error: queryError } = await supabase
//       .from('orders')
//       .select('id, order_type, status, total_kobo, metadata, created_at')
//       .eq('user_id', userId)
//       .order('created_at', { ascending: false });

//     if (queryError) {
//       setError(queryError.message);
//     } else {
//       const mapped = (data as OrderRow[]).map(toOrder);
//       const byType = type ? mapped.filter((o) => o.type === type) : mapped;
//       const byScope =
//         scope === 'active'
//           ? byType.filter((o) => ACTIVE_STATUSES.includes(o.status))
//           : scope === 'finished'
//             ? byType.filter((o) => FINISHED_STATUSES.includes(o.status))
//             : byType;
//       setError(null);
//       setOrders(byScope);
//     }
//     setLoading(false);
//   }, [type, scope, userId]);

//   useFocusEffect(
//     useCallback(() => {
//       load();
//     }, [load])
//   );

//   return { orders, loading, error, refetch: load };
// }

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../components/profile/OrderCard';

type OrderStatus = Order['status'];

type OrderRow = {
  id: string;
  order_type: string | null;
  status: string | null;
  total_kobo: number | string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

function normalizeType(raw: string | null): Order['type'] {
  return raw === 'ewash' ? 'ewash' : 'echop';
}

function normalizeStatus(raw: string | null): OrderStatus {
  switch ((raw ?? '').toLowerCase().trim()) {
    case 'delivered':
    case 'completed':
    case 'complete':
    case 'fulfilled':
      return 'Delivered';
    case 'cancelled':
    case 'canceled':
    case 'failed':
    case 'rejected':
    case 'refunded':
      return 'Cancelled';
    case 'scheduled':
      return 'Scheduled';
    default:
      return 'In Progress';
  }
}

export type OrderScope = 'all' | 'active' | 'finished';

const ACTIVE_STATUSES: OrderStatus[] = ['In Progress', 'Scheduled'];
const FINISHED_STATUSES: OrderStatus[] = ['Delivered', 'Cancelled'];

function formatDate(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === new Date().toDateString()) return `Today, ${time}`;
  return d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
}

function linesSummary(meta: Record<string, any>) {
  const count = Array.isArray(meta.lines)
    ? meta.lines.reduce((sum: number, l: any) => sum + (Number(l?.qty) || 1), 0)
    : Number(meta.items) || 0;
  return count ? `${count} item${count === 1 ? '' : 's'}` : '';
}

function toOrder(row: OrderRow): Order | null {
  const meta = row.metadata ?? {};

  // Subscription purchases (plan buys / renewals) are payments, not orders.
  if (meta.kind === 'subscription') return null;

  const type = normalizeType(row.order_type);
  const status = normalizeStatus(row.status);

  // Title: keep E-Chop's saved title if any, but for E-Wash always show "E-Wash Pickup".
  const title =
    type === 'echop'
      ? String(meta.title ?? 'E-Chop Order')
      : 'E-Wash Pickup';

  const totalNaira =
    row.total_kobo != null ? Number(row.total_kobo) / 100 : Number(meta.total ?? 0);

  const useEta = (status === 'In Progress' || status === 'Scheduled') && typeof meta.eta === 'string';

  return {
    id: row.id,
    type,
    title,
    meta: linesSummary(meta),
    date: useEta ? meta.eta : formatDate(row.created_at),
    amount: Math.round(totalNaira),
    status,
    ref: meta.ref ? String(meta.ref) : undefined,
    rawStatus: row.status ?? '',
  };
}

/**
 * type:  limit to one service ('echop' | 'ewash'), or omit for both.
 * scope: 'active'   → In Progress / Scheduled
 *        'finished' → Delivered / Cancelled
 *        'all'      → everything, newest first (default)
 *
 * Subscription purchases are excluded — they live in Payments.
 */
export function useOrders(type?: Order['type'], scope: OrderScope = 'all') {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from('orders')
      .select('id, order_type, status, total_kobo, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
    } else {
      const mapped = (data as OrderRow[])
        .map(toOrder)
        .filter((o): o is Order => o !== null);
      const byType = type ? mapped.filter((o) => o.type === type) : mapped;
      const byScope =
        scope === 'active'
          ? byType.filter((o) => ACTIVE_STATUSES.includes(o.status))
          : scope === 'finished'
            ? byType.filter((o) => FINISHED_STATUSES.includes(o.status))
            : byType;
      setError(null);
      setOrders(byScope);
    }
    setLoading(false);
  }, [type, scope, userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { orders, loading, error, refetch: load };
}