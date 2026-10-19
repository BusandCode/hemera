// Hemera (customer app): keep text boxes above the keyboard on every screen (iPhone and Android).
// Run from the ROOT of the customer app (the folder with package.json):
//   node apply-keyboard-fix-customer.mjs
// Not changed: cart and schedule-pickup (they already handle the keyboard themselves).
// It edits only the keyboard lines inside each screen (your other changes are kept),
// skips anything it doesn't recognise, and backs up every file it changes.
import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

if (!existsSync('package.json') || !existsSync(join('src', 'hooks', 'useFood.ts'))) {
  console.error('Run this from the root of the Hemera customer app (the folder with package.json and src/hooks/useFood.ts).');
  process.exit(1);
}

const COMPONENT_PATH = 'src/components/KeyboardAwareScrollView.tsx';
const COMPONENT = "// A ScrollView that keeps the text box you are typing in above the keyboard.\n//\n// Screens import it as `ScrollView`, so their existing <ScrollView> tags use it automatically.\n// When the keyboard opens (and when you move to the next field) it scrolls the focused input\n// into view. If the keyboard covers part of the scroll area (Android draws apps edge to edge,\n// so the screen doesn't shrink), it adds that much space at the bottom so every field can be\n// scrolled above the keyboard. Horizontal lists are left alone.\nimport { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';\nimport {\n  Dimensions,\n  Keyboard,\n  ScrollView,\n  TextInput,\n  View,\n  type LayoutChangeEvent,\n  type NativeScrollEvent,\n  type NativeSyntheticEvent,\n  type ScrollViewProps,\n} from 'react-native';\n\nconst GAP = 24; // space left between the input and the top of the keyboard\n\n/** Same instance type as ScrollView, so `useRef<ScrollView>()` keeps working after the swap. */\nexport type KeyboardAwareScrollView = ScrollView;\n\nexport const KeyboardAwareScrollView = forwardRef<ScrollView, ScrollViewProps>(\n  function KeyboardAwareScrollView({ onScroll, onLayout, scrollEventThrottle, children, ...props }, ref) {\n    const scrollRef = useRef<ScrollView>(null);\n    useImperativeHandle(ref, () => scrollRef.current as ScrollView);\n\n    const horizontal = !!props.horizontal;\n    const offsetY = useRef(0);\n    const keyboardTop = useRef<number | null>(null);\n    const lastFocused = useRef<unknown>(null);\n    const [extra, setExtra] = useState(0);\n\n    // How much of this scroll area the keyboard covers.\n    const measureCovered = useCallback(() => {\n      const kbTop = keyboardTop.current;\n      if (kbTop == null) { setExtra(0); return; }\n      const sv: any = scrollRef.current;\n      const node: any = sv?.measureInWindow ? sv : sv?.getNativeScrollRef?.();\n      if (!node?.measureInWindow) return;\n      node.measureInWindow((_x: number, y: number, _w: number, h: number) => {\n        setExtra(Math.max(0, Math.round(y + h - kbTop)));\n      });\n    }, []);\n\n    const reveal = useCallback(() => {\n      const kbTop = keyboardTop.current;\n      const input = TextInput.State.currentlyFocusedInput?.() as any;\n      if (kbTop == null || !input?.measureInWindow) return;\n      input.measureInWindow((_x: number, y: number, _w: number, h: number) => {\n        const overlap = y + h + GAP - kbTop;\n        if (overlap > 0) {\n          scrollRef.current?.scrollTo({ y: offsetY.current + overlap, animated: true });\n        } else if (y < GAP * 2) {\n          // Field is hidden above the visible area (e.g. after scrolling down): bring it back.\n          scrollRef.current?.scrollTo({ y: Math.max(0, offsetY.current + y - GAP * 3), animated: true });\n        }\n      });\n    }, []);\n\n    useEffect(() => {\n      if (horizontal) return;\n      let poll: ReturnType<typeof setInterval> | null = null;\n\n      const onShow = (screenY: number) => {\n        keyboardTop.current = screenY;\n        lastFocused.current = TextInput.State.currentlyFocusedInput?.() ?? null;\n        // Let the screen settle, add the space, then scroll the field into view.\n        setTimeout(measureCovered, 60);\n        setTimeout(reveal, 140);\n        // Moving to the next field keeps the keyboard open, so watch for focus changes.\n        if (poll) clearInterval(poll);\n        poll = setInterval(() => {\n          const now = TextInput.State.currentlyFocusedInput?.() ?? null;\n          if (now && now !== lastFocused.current) {\n            lastFocused.current = now;\n            setTimeout(reveal, 60);\n          }\n        }, 250);\n      };\n\n      const show = Keyboard.addListener('keyboardDidShow', (e) => onShow(e.endCoordinates.screenY));\n      const change = Keyboard.addListener('keyboardDidChangeFrame', (e) => {\n        if (keyboardTop.current == null) return;\n        // Some Android phones report the frame change when the keyboard closes.\n        if (e.endCoordinates.screenY >= Dimensions.get('screen').height - 1) return;\n        keyboardTop.current = e.endCoordinates.screenY;\n        setTimeout(measureCovered, 60);\n        setTimeout(reveal, 140);\n      });\n      const hide = Keyboard.addListener('keyboardDidHide', () => {\n        keyboardTop.current = null;\n        lastFocused.current = null;\n        setExtra(0);\n        if (poll) { clearInterval(poll); poll = null; }\n      });\n\n      return () => {\n        show.remove();\n        change.remove();\n        hide.remove();\n        if (poll) clearInterval(poll);\n      };\n    }, [horizontal, measureCovered, reveal]);\n\n    const handleScroll = useCallback(\n      (e: NativeSyntheticEvent<NativeScrollEvent>) => {\n        offsetY.current = e.nativeEvent.contentOffset.y;\n        onScroll?.(e);\n      },\n      [onScroll],\n    );\n\n    const handleLayout = useCallback(\n      (e: LayoutChangeEvent) => {\n        if (keyboardTop.current != null) setTimeout(measureCovered, 30);\n        onLayout?.(e);\n      },\n      [measureCovered, onLayout],\n    );\n\n    if (horizontal) {\n      return (\n        <ScrollView ref={scrollRef} {...props} onScroll={onScroll} onLayout={onLayout} scrollEventThrottle={scrollEventThrottle}>\n          {children}\n        </ScrollView>\n      );\n    }\n\n    return (\n      <ScrollView\n        ref={scrollRef}\n        keyboardShouldPersistTaps=\"handled\"\n        {...props}\n        onScroll={handleScroll}\n        onLayout={handleLayout}\n        scrollEventThrottle={scrollEventThrottle ?? 16}\n      >\n        {children}\n        {extra > 0 ? <View style={{ height: extra }} /> : null}\n      </ScrollView>\n    );\n  },\n);\n";
const SCROLL_SCREENS = {
 "app/auth.tsx": "../src/components/KeyboardAwareScrollView",
 "app/forgot-password.tsx": "../src/components/KeyboardAwareScrollView",
 "app/track-order.tsx": "../src/components/KeyboardAwareScrollView",
 "app/request-withdrawal.tsx": "../src/components/KeyboardAwareScrollView",
 "app/add-bank-account.tsx": "../src/components/KeyboardAwareScrollView",
 "app/fund-wallet-amount.tsx": "../src/components/KeyboardAwareScrollView",
 "app/contact-support.tsx": "../src/components/KeyboardAwareScrollView",
 "src/components/LockScreen.tsx": "./KeyboardAwareScrollView",
 "app/order-history.tsx": "../src/components/KeyboardAwareScrollView",
 "app/add-payment-method.tsx": "../src/components/KeyboardAwareScrollView",
 "app/delivery-preferences.tsx": "../src/components/KeyboardAwareScrollView",
 "app/request-pickup.tsx": "../src/components/KeyboardAwareScrollView",
 "app/location-picker.tsx": "../src/components/KeyboardAwareScrollView",
 "app/edit-profile.tsx": "../src/components/KeyboardAwareScrollView",
 "app/personal-information.tsx": "../src/components/KeyboardAwareScrollView",
 "app/e-plan-setup.tsx": "../src/components/KeyboardAwareScrollView",
 "app/help-center.tsx": "../src/components/KeyboardAwareScrollView",
 "app/add-address.tsx": "../src/components/KeyboardAwareScrollView",
 "app/e-plan-exclusions.tsx": "../src/components/KeyboardAwareScrollView"
};
const BEHAVIOR_ONLY = ["app/live-chat.tsx", "app/reset-password.tsx", "src/components/ResetPinFlow.tsx"];

const backupDir = join('.update-backup', new Date().toISOString().replace(/[:.]/g, '-'));
const backup = (path) => {
  const b = join(backupDir, path);
  mkdirSync(dirname(b), { recursive: true });
  copyFileSync(path, b);
};
let changed = 0;

// 1) The shared scroll view
if (!existsSync(COMPONENT_PATH) || readFileSync(COMPONENT_PATH, 'utf8') !== COMPONENT) {
  if (existsSync(COMPONENT_PATH)) backup(COMPONENT_PATH);
  mkdirSync(dirname(COMPONENT_PATH), { recursive: true });
  writeFileSync(COMPONENT_PATH, COMPONENT);
  console.log('  saved    ' + COMPONENT_PATH);
  changed++;
} else console.log('  same     ' + COMPONENT_PATH);

// Make KeyboardAvoidingView push content up on Android as well as iPhone.
const fixBehavior = (src) =>
  src
    .replace(/behavior=\{\s*Platform\.OS\s*===\s*['"]ios['"]\s*\?\s*['"]padding['"]\s*:\s*(?:undefined|['"]height['"]|['"]position['"])\s*\}/g, 'behavior="padding"')
    .replace(/behavior=\{\s*Platform\.OS\s*===\s*['"]android['"]\s*\?\s*(?:undefined|['"]height['"])\s*:\s*['"]padding['"]\s*\}/g, 'behavior="padding"');

function patch(path, importPath) {
  if (!existsSync(path)) { console.log('  missing  ' + path + ' (skipped)'); return; }
  const before = readFileSync(path, 'utf8');
  let src = fixBehavior(before);

  if (importPath && !src.includes('KeyboardAwareScrollView')) {
    // Take ScrollView from our keyboard-aware component instead of react-native.
    // Every <ScrollView> on the screen then keeps the focused input above the keyboard.
    const rn = src.match(/import\s*\{([^}]*)\}\s*from\s*['"]react-native['"];?/);
    const names = rn ? rn[1].split(',').map((n) => n.trim()).filter(Boolean) : [];
    if (!rn || !names.includes('ScrollView')) {
      console.log('  note     ' + path + ' (no ScrollView import found; keyboard padding fixed only)');
    } else {
      const rest = names.filter((n) => n !== 'ScrollView');
      const rebuilt =
        `import {\n  ${rest.join(', ')},\n} from 'react-native';\n` +
        `import { KeyboardAwareScrollView as ScrollView } from '${importPath}';`;
      src = src.replace(rn[0], rebuilt);
    }
  }

  if (src === before) { console.log('  same     ' + path); return; }
  backup(path);
  writeFileSync(path, src);
  console.log('  updated  ' + path);
  changed++;
}

for (const [path, importPath] of Object.entries(SCROLL_SCREENS)) patch(path, importPath);
for (const path of BEHAVIOR_ONLY) patch(path, null);

console.log(`\nDone: ${changed} file(s) changed.`);
if (changed) console.log(`Old versions are saved in ${backupDir}`);
