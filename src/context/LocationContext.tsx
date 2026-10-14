import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

type DeliveryLocation = {
  state: string;
  lga: string;
};

type LocationContextValue = {
  location: DeliveryLocation;
  setLocation: (loc: DeliveryLocation) => void;
  resetLocation: () => void;
  formatted: string;
};

const DEFAULT_LOCATION: DeliveryLocation = {
  state: 'Kogi',
  lga: 'Lokoja',
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<DeliveryLocation>(DEFAULT_LOCATION);

  const resetLocation = useCallback(() => setLocation(DEFAULT_LOCATION), []);

  const value = useMemo<LocationContextValue>(() => {
    const formatted =
      location.lga && location.state
        ? `${location.lga}, ${location.state}`
        : location.state || 'Choose location';

    return { location, setLocation, resetLocation, formatted };
  }, [location, resetLocation]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation must be used inside a LocationProvider');
  }
  return ctx;
}