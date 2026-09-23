import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  addAddress: (address: Omit<Address, 'id' | 'isDefault'>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;

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

const initialAddresses: Address[] = [
  { id: 'addr-home', label: 'Home', icon: 'home', line: '14 Adekunle Fajuyi Road, GRA', details: 'Lokoja, Kogi State', isDefault: true },
  { id: 'addr-work', label: 'Work', icon: 'briefcase', line: 'Suite 4B, Zenith Plaza', details: 'Murtala Way, Lokoja', isDefault: false },
];

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

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [cards, setCards] = useState<PaymentCard[]>(initialCards);
  const [security, setSecurity] = useState<SecurityState>(initialSecurity);

  const addAddress: AppDataContextType['addAddress'] = (address) => {
    setAddresses((prev) => [
      ...prev,
      { ...address, id: `addr-${Date.now()}`, isDefault: prev.length === 0 },
    ]);
  };

  const removeAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const setDefaultAddress = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const addCard: AppDataContextType['addCard'] = (card) => {
    setCards((prev) => [
      ...prev,
      { ...card, id: `card-${Date.now()}`, isDefault: prev.length === 0 },
    ]);
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