import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { mapAllowance, type WashAllowance } from '../lib/planLimits';

export type PlanStatus = 'none' | 'active' | 'expired';

export type PlanStatusResult = {
  status: PlanStatus;
  planName: string | null;
  renewsOn: string | null;
  expiredOn: string | null;
  allowance: WashAllowance | null;
  isLoading: boolean;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const NONE: PlanStatusResult = {
  status: 'none',
  planName: null,
  renewsOn: null,
  expiredOn: null,
  allowance: null,
  isLoading: false,
};

export function usePlanStatus(): PlanStatusResult {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id;
  const [result, setResult] = useState<PlanStatusResult>({ ...NONE, isLoading: true });

  const load = useCallback(async () => {
    // Don't query until auth is resolved.
    if (authLoading) return;

    if (!userId) {
      setResult(NONE);
      return;
    }

    const { data, error } = await supabase
      .from('wash_plans')
      .select('plan_name, status, ends_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('ends_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('usePlanStatus: wash_plans query failed:', error.message);
      setResult(NONE);
      return;
    }

    if (!data) {
      setResult(NONE);
      return;
    }

    const endsAtMs = new Date(data.ends_at).getTime();
    const active = endsAtMs > Date.now();

    if (!active) {
      setResult({
        status: 'expired',
        planName: data.plan_name,
        renewsOn: null,
        expiredOn: formatDate(data.ends_at),
        allowance: null,
        isLoading: false,
      });
      return;
    }

    let allowance: WashAllowance | null = null;
    const { data: raw, error: allowError } = await supabase.rpc('get_wash_plan_allowance');
    if (allowError) {
      console.warn('usePlanStatus: get_wash_plan_allowance failed:', allowError.message);
    } else {
      allowance = mapAllowance(raw);
    }

    setResult({
      status: 'active',
      planName: data.plan_name,
      renewsOn: formatDate(data.ends_at),
      expiredOn: null,
      allowance,
      isLoading: false,
    });
  }, [userId, authLoading]);

  // Re-run when auth changes.
  useEffect(() => {
    load();
  }, [load]);

  // Re-run whenever the screen comes back into focus.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return result;
}