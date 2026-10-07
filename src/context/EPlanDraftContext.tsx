import { createContext, useContext, useState, ReactNode } from 'react';
import type { FixedPlan } from '../lib/eplanTiers';

export type EPlanDraft = {
  amount: number;
  duration: '1w' | '2w';
  lunchWindow: boolean;
  dinnerWindow: boolean;
  proteinLabels: string[];
  allergenLabels: string[];
  note: string;
  /** Set when the user picked one of the fixed cards; null for a custom amount. */
  fixedPlan: FixedPlan | null;
};

const DEFAULT_DRAFT: EPlanDraft = {
  amount: 20000,
  duration: '1w',
  lunchWindow: true,
  dinnerWindow: true,
  proteinLabels: [],
  allergenLabels: [],
  note: '',
  fixedPlan: null,
};

type EPlanDraftContextValue = {
  draft: EPlanDraft;
  updateDraft: (next: Partial<EPlanDraft>) => void;
  resetDraft: () => void;
};

const EPlanDraftContext = createContext<EPlanDraftContextValue | null>(null);

export function EPlanDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<EPlanDraft>(DEFAULT_DRAFT);
  const updateDraft = (next: Partial<EPlanDraft>) => setDraft((prev) => ({ ...prev, ...next }));
  const resetDraft = () => setDraft(DEFAULT_DRAFT);
  return (
    <EPlanDraftContext.Provider value={{ draft, updateDraft, resetDraft }}>
      {children}
    </EPlanDraftContext.Provider>
  );
}

export function useEPlanDraft() {
  const ctx = useContext(EPlanDraftContext);
  if (!ctx) throw new Error('useEPlanDraft must be used inside EPlanDraftProvider');
  return ctx;
}