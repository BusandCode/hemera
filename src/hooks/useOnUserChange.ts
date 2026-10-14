import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export function useOnUserChange(callback: () => void) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const previousRef = useRef<string | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (previousRef.current !== null && previousRef.current !== userId) {
      callbackRef.current();
    }
    previousRef.current = userId;
  }, [userId]);
}