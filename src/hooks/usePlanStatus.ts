import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type PlanStatus = 'none' | 'active' | 'expired';

export type PlanStatusResult = {
  status: PlanStatus;
  planName: string | null;
  /** Human-readable renewal date when status is 'active', e.g. "August 6, 2026" */
  renewsOn: string | null;
  /** Human-readable expiry date when status is 'expired', e.g. "July 6, 2026" */
  expiredOn: string | null;
  isLoading: boolean;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const NONE: PlanStatusResult = {
  status: 'none',
  planName: null,
  renewsOn: null,
  expiredOn: null,
  isLoading: false,
};

export function usePlanStatus(): PlanStatusResult {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [result, setResult] = useState<PlanStatusResult>({ ...NONE, isLoading: true });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        if (!userId) {
          if (!cancelled) setResult(NONE);
          return;
        }

        const { data, error } = await supabase
          .from('wash_plans')
          .select('plan_name, status, ends_at')
          .eq('user_id', userId)
          .neq('status', 'cancelled')
          .order('ends_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (error || !data) {
          setResult(NONE);
          return;
        }

        const active = data.status === 'active' && new Date(data.ends_at).getTime() > Date.now();

        setResult({
          status: active ? 'active' : 'expired',
          planName: data.plan_name,
          renewsOn: active ? formatDate(data.ends_at) : null,
          expiredOn: active ? null : formatDate(data.ends_at),
          isLoading: false,
        });
      })();

      return () => {
        cancelled = true;
      };
    }, [userId])
  );

  return result;
}