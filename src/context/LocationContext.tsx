import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

type DeliveryLocation = {
  state: string;
  lga: string;
};

type LocationContextValue = {
  location: DeliveryLocation;
  setLocation: (loc: DeliveryLocation) => void;
  formatted: string;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<DeliveryLocation>({
    state: 'Kogi',
    lga: 'Lokoja',
  });

  const value = useMemo<LocationContextValue>(() => {
    const formatted =
      location.lga && location.state
        ? `${location.lga}, ${location.state}`
        : location.state || 'Choose location';

    return { location, setLocation, formatted };
  }, [location]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation must be used inside a LocationProvider');
  }
  return ctx;
}