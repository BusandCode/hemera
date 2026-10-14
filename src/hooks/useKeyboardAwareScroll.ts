import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';

/**
 * Keeps a focused input visible above the keyboard inside a ScrollView.
 *
 * Works whether or not the OS resizes the window for the keyboard (iOS, Android "resize",
 * Android edge-to-edge / "pan"): it measures how much of the scroll viewport the keyboard
 * actually covers, adds exactly that much bottom padding, and scrolls the active field into view.
 *
 * Usage:
 *   const kb = useKeyboardAwareScroll();
 *   <View ref={kb.viewportRef} collapsable={false} style={{ flex: 1 }}>
 *     <ScrollView ref={kb.scrollRef} onScroll={kb.onScroll} scrollEventThrottle={16}
 *       contentContainerStyle={{ paddingBottom: 24 + kb.keyboardInset }}>
 *       <View ref={fieldRef} collapsable={false}>
 *         <TextInput onFocus={kb.focusTarget(fieldRef)} onContentSizeChange={kb.revealTarget} />
 *       </View>
 *     </ScrollView>
 *   </View>
 */
export function useKeyboardAwareScroll(gap = 16) {
  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef<View>(null);
  const targetRef = useRef<View | null>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef<number | null>(null);

  const [keyboardInset, setKeyboardInset] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  /** Scroll just enough that the active field sits above the keyboard. */
  const revealTarget = useCallback(() => {
    const target = targetRef.current;
    const viewport = viewportRef.current;
    const kbTop = keyboardTop.current;
    if (!target || !viewport || kbTop == null) return;

    viewport.measureInWindow((_vx, vy, _vw, vh) => {
      const visibleTop = vy + gap;
      const visibleBottom = Math.min(vy + vh, kbTop) - gap;
      target.measureInWindow((_x, y, _w, h) => {
        const overflowBottom = y + h - visibleBottom;
        if (overflowBottom > 0) {
          // If the field is taller than the visible space, keep its top in view instead.
          const maxShift = Math.max(0, y - visibleTop);
          scrollRef.current?.scrollTo({
            y: scrollY.current + Math.min(overflowBottom, maxShift || overflowBottom),
            animated: true,
          });
        }
      });
    });
  }, [gap]);

  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      keyboardTop.current = e.endCoordinates.screenY;
      setKeyboardVisible(true);
      // Let the layout settle (window resize, hidden tab bar) before measuring.
      setTimeout(() => {
        const kbTop = keyboardTop.current;
        if (kbTop == null) return;
        viewportRef.current?.measureInWindow((_x, y, _w, h) => {
          setKeyboardInset(Math.max(0, y + h - kbTop));
          setTimeout(revealTarget, 40);
        });
      }, 60);
    };
    const onHide = () => {
      keyboardTop.current = null;
      setKeyboardVisible(false);
      setKeyboardInset(0);
    };

    const subs = [
      Keyboard.addListener('keyboardDidShow', onShow),
      // Keyboard height can change while open (emoji panel, suggestions bar, switching keyboards).
      Keyboard.addListener('keyboardDidChangeFrame', (e) => {
        if (keyboardTop.current != null) onShow(e);
      }),
      Keyboard.addListener('keyboardDidHide', onHide),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [revealTarget]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  }, []);

  /** onFocus handler for a field; pass the ref of the View that wraps it. */
  const focusTarget = useCallback(
    (ref: React.RefObject<View | null>) => () => {
      targetRef.current = ref.current;
      // Moving between fields while the keyboard is already open.
      if (keyboardTop.current != null) setTimeout(revealTarget, 40);
    },
    [revealTarget]
  );

  return {
    scrollRef,
    viewportRef,
    onScroll,
    keyboardInset,
    keyboardVisible,
    focusTarget,
    revealTarget,
  };
}