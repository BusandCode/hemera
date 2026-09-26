import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type Address = {
  id: string;
  label: string;
  icon: 'home' | 'briefcase' | 'map-pin';
  line: string;
  details: string;
  isDefault?: boolean;
};

export type PaymentCard = {
  id: string;
  brand: 'Visa' | 'Mastercard' | 'Verve';
  last4: string;
  expiry: string;
  isDefault?: boolean;
};

export type SecurityState = {
  passwordLastChanged: string;
  pinLastChanged: string;
  biometric: boolean;
  twoFactor: boolean;
};

type AppDataContextType = {
  addresses: Address[];
  addressesLoading: boolean;
  addAddress: (address: Omit<Address, 'id' | 'isDefault'>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;

  cards: PaymentCard[];
  addCard: (card: Omit<PaymentCard, 'id' | 'isDefault'>) => void;
  removeCard: (id: string) => void;
  setDefaultCard: (id: string) => void;

  security: SecurityState;
  recordPasswordChange: () => void;
  recordPinChange: () => void;
  setBiometric: (v: boolean) => void;
  setTwoFactor: (v: boolean) => void;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const initialCards: PaymentCard[] = [
  { id: 'card-1', brand: 'Verve', last4: '4821', expiry: '09/28', isDefault: true },
  { id: 'card-2', brand: 'Mastercard', last4: '7734', expiry: '02/27', isDefault: false },
];

const initialSecurity: SecurityState = {
  passwordLastChanged: '3 months ago',
  pinLastChanged: '6 months ago',
  biometric: true,
  twoFactor: false,
};

function formatChangedNow() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function mapRow(row: any): Address {
  return {
    id: row.id,
    label: row.label,
    icon: row.icon ?? 'map-pin',
    line: row.full_address,
    details: row.details ?? '',
    isDefault: row.is_default,
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [cards, setCards] = useState<PaymentCard[]>(initialCards);
  const [security, setSecurity] = useState<SecurityState>(initialSecurity);

  useEffect(() => {
    if (!userId) {
      setAddresses([]);
      setAddressesLoading(false);
      return;
    }
    (async () => {
      setAddressesLoading(true);
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (!error && data) setAddresses(data.map(mapRow));
      setAddressesLoading(false);
    })();
  }, [userId]);

  const addAddress: AppDataContextType['addAddress'] = async (address) => {
    if (!userId) return;
    const isFirst = addresses.length === 0;
    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: userId,
        label: address.label,
        icon: address.icon,
        full_address: address.line,
        details: address.details,
        is_default: isFirst,
      })
      .select()
      .single();
    if (!error && data) setAddresses((prev) => [...prev, mapRow(data)]);
  };

  const removeAddress = async (id: string) => {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (!error) setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const setDefaultAddress = async (id: string) => {
    if (!userId) return;
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
    const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    if (!error) setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const addCard: AppDataContextType['addCard'] = (card) => {
    setCards((prev) => [...prev, { ...card, id: `card-${Date.now()}`, isDefault: prev.length === 0 }]);
  };

  const removeCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const setDefaultCard = (id: string) => {
    setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
  };

  const recordPasswordChange = () => {
    setSecurity((prev) => ({ ...prev, passwordLastChanged: formatChangedNow() }));
  };

  const recordPinChange = () => {
    setSecurity((prev) => ({ ...prev, pinLastChanged: formatChangedNow() }));
  };

  const setBiometric = (v: boolean) => {
    setSecurity((prev) => ({ ...prev, biometric: v }));
  };

  const setTwoFactor = (v: boolean) => {
    setSecurity((prev) => ({ ...prev, twoFactor: v }));
  };

  return (
    <AppDataContext.Provider
      value={{
        addresses,
        addressesLoading,
        addAddress,
        removeAddress,
        setDefaultAddress,
        cards,
        addCard,
        removeCard,
        setDefaultCard,
        security,
        recordPasswordChange,
        recordPinChange,
        setBiometric,
        setTwoFactor,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within an AppDataProvider');
  return ctx;
}