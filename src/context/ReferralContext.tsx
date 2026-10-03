import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { AppState, Share } from 'react-native';
import * as Linking from 'expo-linking';

import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useProfile } from './ProfileContext';

export type RewardType = 'food' | 'laundry';

export type Referral = {
  id: string;
  status: 'pending' | 'earned' | 'claimed' | 'redeemed';
  rewardType: RewardType | null;
};

type ReferralContextValue = {
  code: string;
  inviteLink: string;
  loading: boolean;
  invitedCount: number;
  qualifiedCount: number;
  earned: Referral[];
  rewards: { food: Referral | null; laundry: Referral | null };
  claimReward: (referralId: string, choice: RewardType) => Promise<void>;
  shareInvite: () => Promise<void>;
  refresh: () => Promise<void>;
};

const ReferralContext = createContext<ReferralContextValue | null>(null);

export function ReferralProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const userId = session?.user.id;

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedCode, setGeneratedCode] = useState('');

  const code = profile.referralCode || generatedCode;

  const refresh = useCallback(async () => {
    if (!userId) {
      setReferrals([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('referrals')
      .select('id, status, reward_type')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: true });
    if (!error && data) {
      setReferrals(
        data.map((r: any) => ({ id: r.id, status: r.status, rewardType: r.reward_type }))
      );
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId || profileLoading || profile.referralCode || generatedCode) return;
    supabase.rpc('ensure_referral_code').then(({ data }) => {
      if (typeof data === 'string') setGeneratedCode(data);
    });
  }, [userId, profileLoading, profile.referralCode, generatedCode]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`referrals:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'referrals', filter: `referrer_id=eq.${userId}` },
        () => {
          refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const claimReward = useCallback(
    async (referralId: string, choice: RewardType) => {
      const { error } = await supabase.rpc('claim_referral_reward', {
        p_referral_id: referralId,
        p_choice: choice,
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh]
  );

  const inviteLink = useMemo(
    () => (code ? Linking.createURL('auth', { queryParams: { ref: code } }) : ''),
    [code]
  );

  const shareInvite = useCallback(async () => {
    if (!code) return;
    try {
      await Share.share({
        message: `Join me on Hemera to order food and book laundry pickups: ${inviteLink}\nReferral code: ${code}`,
      });
    } catch {}
  }, [code, inviteLink]);

  const value = useMemo<ReferralContextValue>(() => {
    const claimed = referrals.filter((r) => r.status === 'claimed');
    return {
      code,
      inviteLink,
      loading,
      invitedCount: referrals.length,
      qualifiedCount: referrals.filter((r) => r.status !== 'pending').length,
      earned: referrals.filter((r) => r.status === 'earned'),
      rewards: {
        food: claimed.find((r) => r.rewardType === 'food') ?? null,
        laundry: claimed.find((r) => r.rewardType === 'laundry') ?? null,
      },
      claimReward,
      shareInvite,
      refresh,
    };
  }, [referrals, code, inviteLink, loading, claimReward, shareInvite, refresh]);

  return <ReferralContext.Provider value={value}>{children}</ReferralContext.Provider>;
}

export function useReferral() {
  const ctx = useContext(ReferralContext);
  if (!ctx) {
    throw new Error('useReferral must be used inside a ReferralProvider');
  }
  return ctx;
}