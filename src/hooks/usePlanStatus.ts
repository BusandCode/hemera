import { useEffect, useState } from 'react';

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

export function usePlanStatus(): PlanStatusResult {
  const [result, setResult] = useState<PlanStatusResult>({
    status: 'none',
    planName: null,
    renewsOn: null,
    expiredOn: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    // TODO: replace with real plan status source (API / store).
    // Expected shape from backend: { status, planName, endDate (ISO) }
    const load = async () => {
      const plan: { status: PlanStatus; planName: string | null; endDate: string | null } = {
        status: 'none',
        planName: null,
        endDate: null,
      };

      if (cancelled) return;

      setResult({
        status: plan.status,
        planName: plan.planName,
        renewsOn: plan.status === 'active' && plan.endDate ? formatDate(plan.endDate) : null,
        expiredOn: plan.status === 'expired' && plan.endDate ? formatDate(plan.endDate) : null,
        isLoading: false,
      });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return result;
}