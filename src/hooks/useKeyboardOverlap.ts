import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform, View } from 'react-native';

/**
 * Returns how many px of `ref` the keyboard covers, plus an onLayout handler.
 *
 * Attach `onLayout` to the same view as `ref`. On Android some devices resize the
 * window for the keyboard (adjustResize) and some don't (edge-to-edge). keyboardDidShow
 * can fire before that resize has landed, so the first measurement may count the
 * keyboard twice. Re-measuring when the root's frame changes corrects this on every
 * device: if the window shrank, the overlap drops to 0; if it didn't, it stays put.
 * Padding applied to the root doesn't change its frame, so this can't loop.
 */
export function useKeyboardAvoidance(ref: RefObject<View | null>, enabled = true) {
  const [overlap, setOverlap] = useState(0);
  const keyboardTop = useRef<number | null>(null);

  const measure = useCallback(() => {
    const top = keyboardTop.current;
    const node = ref.current;
    if (top == null || !node) return;
    node.measureInWindow((_x, y, _width, height) => {
      setOverlap(Math.max(0, Math.round(y + height - top)));
    });
  }, [ref]);

  useEffect(() => {
    if (!enabled) {
      keyboardTop.current = null;
      setOverlap(0);
      return;
    }

    const ios = Platform.OS === 'ios';

    const onShow = (event: KeyboardEvent) => {
      keyboardTop.current = event.endCoordinates.screenY;
      if (!ref.current) {
        setOverlap(event.endCoordinates.height);
        return;
      }
      measure();
    };

    const onHide = () => {
      keyboardTop.current = null;
      setOverlap(0);
    };

    const subscriptions = [
      Keyboard.addListener(ios ? 'keyboardWillChangeFrame' : 'keyboardDidShow', onShow),
      Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', onHide),
    ];

    return () => subscriptions.forEach((s) => s.remove());
  }, [ref, enabled, measure]);

  return { overlap, onLayout: measure };
}

/** Unchanged signature for screens already using it. */
export function useKeyboardOverlap(ref: RefObject<View | null>, enabled = true) {
  return useKeyboardAvoidance(ref, enabled).overlap;
}
