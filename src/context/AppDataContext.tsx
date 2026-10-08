import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useLocation } from './LocationContext';
export type Address = {
  id: string;
  label: string;
  icon: 'home' | 'briefcase' | 'map-pin';
  line: string;
  /** "LGA, State" text shown under the street line. */
  details: string;
  /** Structured area, matching the names in the location picker. */
  state?: string;
  lga?: string;
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
  /** Human-readable, e.g. "3 months ago". Worked out from the saved date. */
  passwordLastChanged: string;
  pinLastChanged: string;
  biometric: boolean;
  twoFactor: boolean;
};

type AppDataContextType = {
  addresses: Address[];
  /** The address marked default, or null when there are none. */
  defaultAddress: Address | null;
  addressesLoading: boolean;
  addressesError: string | null;
  refreshAddresses: () => Promise<void>;
  /** Saves to the database. Throws an Error with a readable message on failure. */
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

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;

/** Turns an ISO date into "just now", "5 hours ago", "3 months ago", etc. */
function formatRelative(iso: string | null): string {
  if (!iso) return 'not available';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'not available';

  const diff = Math.max(0, Date.now() - then);
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return plural(Math.floor(diff / MINUTE), 'minute');
  if (diff < DAY) return plural(Math.floor(diff / HOUR), 'hour');

  const days = Math.floor(diff / DAY);
  if (days < 30) return plural(days, 'day');
  if (days < 365) return plural(Math.floor(days / 30), 'month');
  return plural(Math.floor(days / 365), 'year');
}

function mapRow(row: any): Address {
  return {
    id: row.id,
    label: row.label,
    icon: row.icon ?? 'map-pin',
    line: row.full_address,
    details: row.details ?? '',
    state: row.state ?? undefined,
    lga: row.lga ?? undefined,
    isDefault: row.is_default,
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { setLocation } = useLocation();
  const userId = session?.user.id;
  const meta = session?.user.user_metadata as Record<string, any> | undefined;
  const savedPasswordChangedAt: string | undefined = meta?.password_changed_at;
  const savedPinChangedAt: string | undefined = meta?.pin_changed_at;
  const createdAt: string | undefined = session?.user.created_at;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [cards, setCards] = useState<PaymentCard[]>(initialCards);

  // Real dates (ISO strings). Biometric and two-factor stay in memory for now.
  const [passwordChangedAt, setPasswordChangedAt] = useState<string | null>(null);
  const [pinChangedAt, setPinChangedAt] = useState<string | null>(null);
  const [biometric, setBiometricState] = useState(false);
  const [twoFactor, setTwoFactorState] = useState(false);

  // Load the saved dates for the signed-in user. If a date was never saved
  // (an account that hasn't changed it yet), fall back to when the account was created.
  useEffect(() => {
    if (!userId) {
      setPasswordChangedAt(null);
      setPinChangedAt(null);
      return;
    }
    setPasswordChangedAt(savedPasswordChangedAt ?? createdAt ?? null);
    setPinChangedAt(savedPinChangedAt ?? createdAt ?? null);
  }, [userId, savedPasswordChangedAt, savedPinChangedAt, createdAt]);

  const security: SecurityState = useMemo(
    () => ({
      passwordLastChanged: formatRelative(passwordChangedAt),
      pinLastChanged: formatRelative(pinChangedAt),
      biometric,
      twoFactor,
    }),
    [passwordChangedAt, pinChangedAt, biometric, twoFactor]
  );

  const loadAddresses = useCallback(async () => {
    if (!userId) {
      setAddresses([]);
      setAddressesError(null);
      setAddressesLoading(false);
      return;
    }
    setAddressesLoading(true);
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) {
      setAddressesError(error.message);
    } else {
      setAddresses((data ?? []).map(mapRow));
      setAddressesError(null);
    }
    setAddressesLoading(false);
  }, [userId]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? null;

  // The default address decides the delivery location shown across the app
  // (home header, store and suggestion filtering, checkout).
  useEffect(() => {
    if (defaultAddress?.state && defaultAddress?.lga) {
      setLocation({ state: defaultAddress.state, lga: defaultAddress.lga });
    }
  }, [defaultAddress?.id, defaultAddress?.state, defaultAddress?.lga]);

  const addAddress: AppDataContextType['addAddress'] = async (address) => {
    if (!userId) throw new Error('You need to be signed in to save an address.');
    const isFirst = addresses.length === 0;
    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: userId,
        label: address.label,
        icon: address.icon,
        full_address: address.line,
        details: address.details,
        state: address.state ?? null,
        lga: address.lga ?? null,
        is_default: isFirst,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    setAddresses((prev) => [...prev, mapRow(data)]);
  };

  const removeAddress = async (id: string) => {
    const target = addresses.find((a) => a.id === id);
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) throw new Error(error.message);

    let remaining = addresses.filter((a) => a.id !== id);

    // Never leave the user without a default while they still have addresses.
    if (target?.isDefault && remaining.length > 0) {
      const next = remaining[0];
      const { error: promoteError } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', next.id);
      if (!promoteError) {
        remaining = remaining.map((a) => (a.id === next.id ? { ...a, isDefault: true } : a));
      }
    }
    setAddresses(remaining);
  };

  const setDefaultAddress = async (id: string) => {
    if (!userId) throw new Error('You need to be signed in to change your default address.');

    const { error: clearError } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
    if (clearError) throw new Error(clearError.message);

    const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    if (error) {
      await loadAddresses(); // put the screen back in sync with the database
      throw new Error(error.message);
    }
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
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

  // Saves the date on the user's account so it survives restarts.
  // Returns true when saved. On failure it tells the user and returns false.
  const saveChangeDate = async (
    key: 'password_changed_at' | 'pin_changed_at',
    iso: string
  ): Promise<boolean> => {
    try {
      // updateUser reports failures through `error` instead of throwing.
      const { error } = await supabase.auth.updateUser({ data: { [key]: iso } });
      if (error) throw error;
      return true;
    } catch {
      Alert.alert(
        'Not saved',
        'We couldn’t save that change. Please check your connection and try again.'
      );
      return false;
    }
  };

  const recordPasswordChange = () => {
    const previous = passwordChangedAt;
    const iso = new Date().toISOString();
    setPasswordChangedAt(iso);
    void saveChangeDate('password_changed_at', iso).then((ok) => {
      if (!ok) setPasswordChangedAt(previous); // don't show a date that wasn't saved
    });
  };

  const recordPinChange = () => {
    const previous = pinChangedAt;
    const iso = new Date().toISOString();
    setPinChangedAt(iso);
    void saveChangeDate('pin_changed_at', iso).then((ok) => {
      if (!ok) setPinChangedAt(previous);
    });
  };

  const setBiometric = (v: boolean) => {
    setBiometricState(v);
  };

  const setTwoFactor = (v: boolean) => {
    setTwoFactorState(v);
  };

  return (
    <AppDataContext.Provider
      value={{
        addresses,
        defaultAddress,
        addressesLoading,
        addressesError,
        refreshAddresses: loadAddresses,
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