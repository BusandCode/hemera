import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useWalletBalance() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [balanceKobo, setBalanceKobo] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from('wallets').select('balance_kobo').eq('user_id', userId).single();
    setBalanceKobo(data?.balance_kobo ?? 0);
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { balanceKobo, balanceNaira: Math.round(balanceKobo / 100), loading, refresh: load };
}