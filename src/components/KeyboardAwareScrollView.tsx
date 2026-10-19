// A ScrollView that keeps the text box you are typing in above the keyboard.
//
// Screens import it as `ScrollView`, so their existing <ScrollView> tags use it automatically.
// When the keyboard opens (and when you move to the next field) it scrolls the focused input
// into view. If the keyboard covers part of the scroll area (Android draws apps edge to edge,
// so the screen doesn't shrink), it adds that much space at the bottom so every field can be
// scrolled above the keyboard. Horizontal lists are left alone.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  ScrollView,
  TextInput,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';

const GAP = 24; // space left between the input and the top of the keyboard

/** Same instance type as ScrollView, so `useRef<ScrollView>()` keeps working after the swap. */
export type KeyboardAwareScrollView = ScrollView;

export const KeyboardAwareScrollView = forwardRef<ScrollView, ScrollViewProps>(
  function KeyboardAwareScrollView({ onScroll, onLayout, scrollEventThrottle, children, ...props }, ref) {
    const scrollRef = useRef<ScrollView>(null);
    useImperativeHandle(ref, () => scrollRef.current as ScrollView);

    const horizontal = !!props.horizontal;
    const offsetY = useRef(0);
    const keyboardTop = useRef<number | null>(null);
    const lastFocused = useRef<unknown>(null);
    const [extra, setExtra] = useState(0);

    // How much of this scroll area the keyboard covers.
    const measureCovered = useCallback(() => {
      const kbTop = keyboardTop.current;
      if (kbTop == null) { setExtra(0); return; }
      const sv: any = scrollRef.current;
      const node: any = sv?.measureInWindow ? sv : sv?.getNativeScrollRef?.();
      if (!node?.measureInWindow) return;
      node.measureInWindow((_x: number, y: number, _w: number, h: number) => {
        setExtra(Math.max(0, Math.round(y + h - kbTop)));
      });
    }, []);

    const reveal = useCallback(() => {
      const kbTop = keyboardTop.current;
      const input = TextInput.State.currentlyFocusedInput?.() as any;
      if (kbTop == null || !input?.measureInWindow) return;
      input.measureInWindow((_x: number, y: number, _w: number, h: number) => {
        const overlap = y + h + GAP - kbTop;
        if (overlap > 0) {
          scrollRef.current?.scrollTo({ y: offsetY.current + overlap, animated: true });
        } else if (y < GAP * 2) {
          // Field is hidden above the visible area (e.g. after scrolling down): bring it back.
          scrollRef.current?.scrollTo({ y: Math.max(0, offsetY.current + y - GAP * 3), animated: true });
        }
      });
    }, []);

    useEffect(() => {
      if (horizontal) return;
      let poll: ReturnType<typeof setInterval> | null = null;

      const onShow = (screenY: number) => {
        keyboardTop.current = screenY;
        lastFocused.current = TextInput.State.currentlyFocusedInput?.() ?? null;
        // Let the screen settle, add the space, then scroll the field into view.
        setTimeout(measureCovered, 60);
        setTimeout(reveal, 140);
        // Moving to the next field keeps the keyboard open, so watch for focus changes.
        if (poll) clearInterval(poll);
        poll = setInterval(() => {
          const now = TextInput.State.currentlyFocusedInput?.() ?? null;
          if (now && now !== lastFocused.current) {
            lastFocused.current = now;
            setTimeout(reveal, 60);
          }
        }, 250);
      };

      const show = Keyboard.addListener('keyboardDidShow', (e) => onShow(e.endCoordinates.screenY));
      const change = Keyboard.addListener('keyboardDidChangeFrame', (e) => {
        if (keyboardTop.current == null) return;
        // Some Android phones report the frame change when the keyboard closes.
        if (e.endCoordinates.screenY >= Dimensions.get('screen').height - 1) return;
        keyboardTop.current = e.endCoordinates.screenY;
        setTimeout(measureCovered, 60);
        setTimeout(reveal, 140);
      });
      const hide = Keyboard.addListener('keyboardDidHide', () => {
        keyboardTop.current = null;
        lastFocused.current = null;
        setExtra(0);
        if (poll) { clearInterval(poll); poll = null; }
      });

      return () => {
        show.remove();
        change.remove();
        hide.remove();
        if (poll) clearInterval(poll);
      };
    }, [horizontal, measureCovered, reveal]);

    const handleScroll = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        offsetY.current = e.nativeEvent.contentOffset.y;
        onScroll?.(e);
      },
      [onScroll],
    );

    const handleLayout = useCallback(
      (e: LayoutChangeEvent) => {
        if (keyboardTop.current != null) setTimeout(measureCovered, 30);
        onLayout?.(e);
      },
      [measureCovered, onLayout],
    );

    if (horizontal) {
      return (
        <ScrollView ref={scrollRef} {...props} onScroll={onScroll} onLayout={onLayout} scrollEventThrottle={scrollEventThrottle}>
          {children}
        </ScrollView>
      );
    }

    return (
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        {...props}
        onScroll={handleScroll}
        onLayout={handleLayout}
        scrollEventThrottle={scrollEventThrottle ?? 16}
      >
        {children}
        {extra > 0 ? <View style={{ height: extra }} /> : null}
      </ScrollView>
    );
  },
);
