import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

type Scrollable = {
  scrollTo?: (o: { x?: number; y?: number; animated?: boolean }) => void; // ScrollView
  scrollToOffset?: (o: { offset: number; animated?: boolean }) => void; // FlatList / FlashList
};

// Long enough for the push animation to fully cover this screen.
const HIDDEN_DELAY_MS = 450;

/**
 * Resets the screen to the top while the user is AWAY from it,
 * so when they come back (router.back(), tab switch) it's already at the top
 * and there's no visible jump.
 *
 * Optional `onRefocus` runs each time the screen is returned to (not on first mount).
 */
export function useResetOnFocus<T extends Scrollable>(onRefocus?: () => void) {
  const scrollRef = useRef<T>(null);
  const isFirstFocus = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRefocusRef = useRef(onRefocus);
  onRefocusRef.current = onRefocus;

  useFocusEffect(
    useCallback(() => {
      // Screen gained focus: cancel a pending reset if the user came back very quickly.
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }

      if (isFirstFocus.current) {
        isFirstFocus.current = false;
      } else {
        onRefocusRef.current?.();
      }

      // Screen lost focus: wait until it's covered by the next screen, then reset silently.
      return () => {
        timer.current = setTimeout(() => {
          timer.current = null;
          const el = scrollRef.current;
          if (el?.scrollToOffset) el.scrollToOffset({ offset: 0, animated: false });
          else el?.scrollTo?.({ y: 0, animated: false });
        }, HIDDEN_DELAY_MS);
      };
    }, [])
  );

  return scrollRef;
}