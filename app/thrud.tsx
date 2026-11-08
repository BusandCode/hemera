// Thrud — short videos (max 15 s) of E-Chop meals, shown like reels.
//   For You   = restaurants in the customer's state (their LGA first). Following = their favourite restaurants.
//   Add (cart) adds the MEAL to the normal cart · thumbs up likes the meal · comments + replies · share on WhatsApp.
//   The heart by the restaurant's name adds the restaurant to favourites.
// Videos stay on Thrud until the restaurant or Hemera deletes them.
//
// Performance:
//   - The feed loads 8 videos at a time; the list of videos (history) is kept so you can scroll back.
//   - At most 3 video players exist: current, next and previous. Others are released (the video stays in the list).
//   - Fast scrolling: only the video you stop on starts loading; its neighbours are prepared once you settle.
//   - Only the current video plays, with sound; the others are paused and muted.
//   - Watched videos are cached on the phone (up to 150 MB, oldest removed first) so scrolling back doesn't re-download.
//   - Videos you've already watched go to the back next time, so each visit starts with new ones.
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, Share, StyleSheet, Text,
  TextInput, TouchableOpacity, View, type ViewToken,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../src/constants/foodColors';

// expo-video is a native module: an app build without it would crash on import, so load it carefully.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ExpoVideo: any = (() => { try { return require('expo-video'); } catch { return null; } })();
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { useFavorites } from '../src/context/FavoritesContext';
import { useLocation } from '../src/context/LocationContext';
import { useAllMenuItems } from '../src/hooks/useFood';
import { useDialog } from '../src/components/ui/DialogProvider';
import type { MenuItem } from '../src/constants/foodData';
import { fonts } from '../src/constants/typography';
import { ms } from '../src/utils/responsive';

// ---------------------------------------------------------------- settings
const PAGE_SIZE = 8;                         // videos fetched per batch
const VIDEO_CACHE_BYTES = 150 * 1024 * 1024; // on-phone cache for watched videos
const SETTLE_MS = 220;                       // wait this long after scrolling stops before preparing neighbours
const SEEN_AFTER_MS = 2000;                  // a video counts as watched after this long on screen
const SEEN_KEY = 'thrud:seen:v1';
const SEEN_MAX = 300;

const BLUE = '#255DDE';
const RED = foodColors.primary;     // #E23A2E
const SHADOW = { textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } };

// Cache size can only be changed while no player exists, so do it once, before the first video.
let cacheConfigured = false;
function configureVideoCache() {
  if (cacheConfigured || !ExpoVideo?.setVideoCacheSizeAsync) return;
  cacheConfigured = true;
  ExpoVideo.setVideoCacheSizeAsync(VIDEO_CACHE_BYTES).catch(() => { /* older expo-video: default cache */ });
}

type Reel = {
  id: string;
  video_path: string;
  caption: string | null;
  like_count: number;
  comment_count: number;
  liked: boolean;
  created_at: string;
  expires_at: string | null;
  store_id: string;
  store_name: string;
  store_logo: string | null;
  product_id: string;
  product_name: string;
  product_price_kobo: number;
  product_in_stock: boolean;
  product_image: string | null;
};

type Comment = { id: string; parent_id: string | null; author_name: string | null; body: string; created_at: string; user_id: string; edited_at?: string | null };
type Rating = { rating: number; reviews: number };
type Tab = 'forYou' | 'following';
type Feed = { items: Reel[]; loading: boolean; error: string | null; done: boolean; moreError: boolean };

const EMPTY_FEED: Feed = { items: [], loading: true, error: null, done: false, moreError: false };

const naira = (kobo: number) => `₦${Math.round((kobo ?? 0) / 100).toLocaleString()}`;
const videoUrl = (path: string) => supabase.storage.from('product-videos').getPublicUrl(path).data.publicUrl;
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K` : String(n));
const compactLower = (n: number) => compact(n).toLowerCase();

function ago(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const LOGO = require('../assets/icon-thrud.png');

// ---------------------------------------------------------------- watched videos (kept on the phone)
async function readSeen(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string').slice(-SEEN_MAX) : [];
  } catch { return []; }
}
let seenWrite: Promise<void> = Promise.resolve();
function markSeen(id: string) {
  seenWrite = seenWrite.then(async () => {
    const list = await readSeen();
    if (list.includes(id)) return;
    try { await AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...list, id].slice(-SEEN_MAX))); } catch { /* full */ }
  });
}

export default function ThrudScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pageH, setPageH] = useState(0);
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const { itemCount } = useCart();
  const { favoriteIds } = useFavorites();
  const { location, formatted: placeLabel } = useLocation();
  const { items: menu, loading: menuLoading } = useAllMenuItems();
  const menuById = useMemo(() => new Map(menu.map((m) => [m.id, m])), [menu]);

  const [tab, setTab] = useState<Tab>('forYou');
  const [feeds, setFeeds] = useState<Record<Tab, Feed>>({ forYou: EMPTY_FEED, following: EMPTY_FEED });
  const [ratings, setRatings] = useState<Map<string, Rating>>(new Map());
  const [active, setActive] = useState(0);
  const [settled, setSettled] = useState(0);
  const [focused, setFocused] = useState(true);
  const [commentsFor, setCommentsFor] = useState<Reel | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  // Search results play as reels in place of the feed; ✕ goes back to For You / Following.
  const [search, setSearch] = useState<{ query: string; items: Reel[]; start: number } | null>(null);
  const listRef = useRef<FlatList<Reel>>(null);
  const seenSnapshot = useRef<string[] | null>(null);
  const busy = useRef<Record<Tab, boolean>>({ forYou: false, following: false });
  const feedsRef = useRef(feeds);
  feedsRef.current = feeds;

  const feed = feeds[tab];
  const view: Feed = search ? { items: search.items, loading: false, error: null, done: true, moreError: false } : feed;
  const favKey = favoriteIds.join(',');

  const fetchPage = useCallback(async (t: Tab, offset: number): Promise<Reel[]> => {
    if (seenSnapshot.current === null) seenSnapshot.current = await readSeen();
    if (t === 'following' && favoriteIds.length === 0) return [];
    const { data, error } = await supabase.rpc('hemera_thrud_feed2', {
      p_state: t === 'forYou' ? location.state || null : null,
      p_lga: t === 'forYou' ? location.lga || null : null,
      p_store_ids: t === 'following' ? favoriteIds : null,
      p_seen: seenSnapshot.current.length ? seenSnapshot.current : null,
      p_limit: PAGE_SIZE,
      p_offset: offset,
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as Reel[];
  }, [location.state, location.lga, favKey]);   // eslint-disable-line react-hooks/exhaustive-deps

  const loadFirst = useCallback(async (t: Tab) => {
    busy.current[t] = true;
    setFeeds((f) => ({ ...f, [t]: { ...EMPTY_FEED } }));
    try {
      const rows = await fetchPage(t, 0);
      setFeeds((f) => ({ ...f, [t]: { items: rows, loading: false, error: null, done: rows.length < PAGE_SIZE, moreError: false } }));
    } catch {
      setFeeds((f) => ({ ...f, [t]: { ...EMPTY_FEED, loading: false, error: 'No connection. Check your internet and try again.' } }));
    } finally {
      busy.current[t] = false;
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    const t = tab;
    const f = feedsRef.current[t];
    if (busy.current[t] || f.done || f.loading || f.items.length === 0) return;
    busy.current[t] = true;
    try {
      const rows = await fetchPage(t, f.items.length);
      setFeeds((all) => {
        const cur = all[t];
        const fresh = rows.filter((r) => !cur.items.some((x) => x.id === r.id));
        return { ...all, [t]: { ...cur, items: [...cur.items, ...fresh], done: rows.length < PAGE_SIZE, moreError: false } };
      });
    } catch {
      setFeeds((all) => ({ ...all, [t]: { ...all[t], moreError: true } }));
    } finally {
      busy.current[t] = false;
    }
  }, [tab, fetchPage]);

  // Fresh feed every time Thrud opens (and when the area or favourites change).
  useEffect(() => { configureVideoCache(); }, []);
  useEffect(() => { void loadFirst('forYou'); }, [location.state, location.lga]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Opened from a notification (e.g. "Tunde replied to your comment"): show that video first,
  // and open its comments.
  const params = useLocalSearchParams<{ video?: string; comments?: string }>();
  const openedFor = useRef<string | null>(null);
  useEffect(() => {
    const vid = typeof params.video === 'string' ? params.video : null;
    if (!vid || openedFor.current === vid || feeds.forYou.loading) return;
    openedFor.current = vid;
    (async () => {
      const { data } = await supabase.rpc('hemera_thrud_video', { p_id: vid });
      const v = Array.isArray(data) ? ((data as any[])[0] as Reel | undefined) : undefined;
      if (!v) return;
      setSearch(null); setTab('forYou'); setActive(0); setSettled(0);
      setFeeds((all) => ({ ...all, forYou: { ...all.forYou, items: [v, ...all.forYou.items.filter((r) => r.id !== v.id)] } }));
      if (params.comments === '1') setCommentsFor(v);
    })();
  }, [params.video, feeds.forYou.loading]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void loadFirst('following'); }, [favKey]);                      // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    supabase.rpc('hemera_store_ratings').then(({ data }) => {
      if (Array.isArray(data)) {
        setRatings(new Map((data as any[]).map((x) => [String(x.store_id), { rating: Number(x.rating) || 0, reviews: Number(x.reviews) || 0 }])));
      }
    });
  }, []);

  // Coming back to Thrud (e.g. from a restaurant page): refresh likes / comments of the videos already
  // loaded, with a small spinner, keeping your place in the feed.
  const [syncing, setSyncing] = useState(false);
  const firstFocus = useRef(true);
  const refreshCounts = useCallback(async () => {
    const ids = [...new Set([...feedsRef.current.forYou.items, ...feedsRef.current.following.items].map((r) => r.id))].slice(0, 80);
    if (!ids.length) return;
    setSyncing(true);
    try {
      const [{ data: rows }, likes] = await Promise.all([
        supabase.from('product_videos').select('id, like_count, comment_count').in('id', ids),
        userId ? supabase.from('video_likes').select('video_id').eq('user_id', userId).in('video_id', ids) : Promise.resolve({ data: [] as any[] }),
      ]);
      const liked = new Set(((likes as any).data ?? []).map((l: any) => String(l.video_id)));
      const byId = new Map(((rows ?? []) as any[]).map((r) => [String(r.id), r]));
      const upd = (r: Reel): Reel => {
        const x = byId.get(r.id);
        return x ? { ...r, like_count: x.like_count ?? r.like_count, comment_count: x.comment_count ?? r.comment_count, liked: liked.has(r.id) } : r;
      };
      setFeeds((all) => ({
        forYou: { ...all.forYou, items: all.forYou.items.map(upd) },
        following: { ...all.following, items: all.following.items.map(upd) },
      }));
    } catch { /* keep what's on screen */ } finally {
      setSyncing(false);
    }
  }, [userId]);

  // Pause when leaving the screen; refresh when coming back.
  useFocusEffect(useCallback(() => {
    setFocused(true);
    if (firstFocus.current) firstFocus.current = false;
    else void refreshCounts();
    return () => setFocused(false);
  }, [refreshCounts]));

  // Neighbours are prepared only once scrolling has settled (fast flicks don't start a player per video).
  useEffect(() => {
    const t = setTimeout(() => setSettled(active), SETTLE_MS);
    return () => clearTimeout(t);
  }, [active]);

  // Watched for 2 s → goes to the back of the queue next time.
  const current = view.items[active];
  useEffect(() => {
    if (!current || !focused) return;
    const t = setTimeout(() => markSeen(current.id), SEEN_AFTER_MS);
    return () => clearTimeout(t);
  }, [current?.id, focused]);   // eslint-disable-line react-hooks/exhaustive-deps

  const patch = useCallback((id: string, change: Partial<Reel>) => {
    setFeeds((all) => ({
      forYou: { ...all.forYou, items: all.forYou.items.map((r) => (r.id === id ? { ...r, ...change } : r)) },
      following: { ...all.following, items: all.following.items.map((r) => (r.id === id ? { ...r, ...change } : r)) },
    }));
    setSearch((s) => (s ? { ...s, items: s.items.map((r) => (r.id === id ? { ...r, ...change } : r)) } : s));
    setCommentsFor((c) => (c && c.id === id ? { ...c, ...change } : c));
  }, []);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.index != null) setActive(first.index);
  }).current;

  const switchTab = (t: Tab) => { if (t !== tab) { setActive(0); setSettled(0); setTab(t); } };
  const openResults = (query: string, items: Reel[], start: number) => {
    setSearchOpen(false);
    setActive(start); setSettled(start);
    setSearch({ query, items, start });
  };
  const closeSearch = () => { setSearch(null); setActive(0); setSettled(0); };
  const needSignIn = useCallback(() => router.push('/auth' as any), [router]);
  const openStore = useCallback((id: string) => router.push(`/partner/${id}` as any), [router]);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/echop' as any));
  const refreshThrud = () => {
    setSearch(null);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    setActive(0); setSettled(0);
    seenSnapshot.current = null;
    void loadFirst(tab);
  };

  // Videos: dark screen, light status bar. Loading / empty / error: our light background.
  const onVideo = !view.loading && !view.error && view.items.length > 0 && pageH > 0;
  const ink = onVideo ? '#fff' : foodColors.textPrimary;

  return (
    <View style={[styles.root, !onVideo && { backgroundColor: foodColors.background }]}>
      <StatusBar style={onVideo ? 'light' : 'dark'} />

      <View style={{ flex: 1 }} onLayout={(e) => setPageH(Math.round(e.nativeEvent.layout.height))}>
        {view.loading || pageH === 0 ? (
          <View style={styles.center}><ActivityIndicator color={BLUE} /></View>
        ) : view.error ? (
          <View style={styles.center}>
            <View style={styles.emptyIcon}><Feather name="wifi-off" size={28} color={BLUE} /></View>
            <Text style={styles.emptyText}>{view.error}</Text>
            <TouchableOpacity style={styles.retry} onPress={() => loadFirst(tab)}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : view.items.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.emptyIcon}><Feather name={tab === 'following' ? 'heart' : 'film'} size={30} color={BLUE} /></View>
            <Text style={styles.emptyTitle}>
              {tab === 'following' ? 'Nothing from your favourites yet' : `No videos in ${placeLabel} yet`}
            </Text>
            <Text style={styles.emptyText}>
              {tab === 'following'
                ? 'Tap the heart next to a restaurant’s name to add it to your favourites. Their videos show here.'
                : 'Restaurants near you haven’t posted today. Check back later, or change your location.'}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            key={search ? `search-${search.query}-${search.start}` : tab}
            data={view.items}
            initialScrollIndex={search && search.start < search.items.length ? search.start : undefined}
            keyExtractor={(r) => r.id}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={pageH}
            disableIntervalMomentum
            getItemLayout={(_, i) => ({ length: pageH, offset: pageH * i, index: i })}
            onViewableItemsChanged={onViewable}
            viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
            onEndReached={search ? undefined : loadMore}
            onEndReachedThreshold={2}
            windowSize={5}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            removeClippedSubviews
            extraData={[active, settled, focused, commentsFor, searchOpen, search, menuById, ratings, menuLoading]}
            ListFooterComponent={!search && feed.moreError ? (
              <TouchableOpacity style={styles.moreRetry} onPress={loadMore}>
                <Feather name="refresh-cw" size={14} color="#fff" />
                <Text style={styles.moreRetryText}>Couldn’t load more. Tap to retry.</Text>
              </TouchableOpacity>
            ) : null}
            renderItem={({ item, index }) => {
              const isActive = index === active;
              // 3-slot window: current, plus previous and next once scrolling has settled.
              const withPlayer = isActive || (settled === active && Math.abs(index - active) === 1);
              return (
                <ReelItem
                  reel={item}
                  menuItem={menuById.get(item.product_id)}
                  menuLoading={menuLoading}
                  rating={ratings.get(item.store_id)}
                  height={pageH}
                  playing={focused && isActive && !commentsFor && !searchOpen}
                  withPlayer={withPlayer}
                  userId={userId}
                  onNeedSignIn={needSignIn}
                  onPatch={patch}
                  onComments={setCommentsFor}
                  onOpenStore={openStore}
                />
              );
            }}
          />
        )}

        {/* Top bar: back + logo · For You / Following · search, then the location */}
        <View style={[styles.topBar, { paddingTop: insets.top + ms(6) }]} pointerEvents="box-none">
          <View style={styles.topRow}>
            <View style={styles.brand}>
              <TouchableOpacity onPress={goBack} hitSlop={10} style={styles.backBtn}>
                <Feather name="chevron-left" size={ms(24)} color={ink} style={onVideo ? SHADOW : undefined} />
              </TouchableOpacity>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            </View>
            {search ? (
              <TouchableOpacity style={styles.searchPill} onPress={() => setSearchOpen(true)} activeOpacity={0.85}>
                <Feather name="search" size={ms(13)} color="#fff" />
                <Text style={styles.searchPillText} numberOfLines={1}>{search.query}</Text>
                <TouchableOpacity onPress={closeSearch} hitSlop={10} accessibilityLabel="Close search">
                  <Feather name="x" size={ms(15)} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            ) : (
            <View style={styles.tabs}>
              {(['forYou', 'following'] as Tab[]).map((t) => (
                <TouchableOpacity key={t} onPress={() => switchTab(t)} hitSlop={8} style={styles.tabBtn}>
                  <Text style={[styles.tabText, { color: onVideo ? 'rgba(255,255,255,0.72)' : foodColors.textSecondary }, !onVideo && styles.noShadow, tab === t && { color: ink }]}>
                    {t === 'forYou' ? 'For You' : 'Following'}
                  </Text>
                  <View style={[styles.tabLine, tab === t && styles.tabLineOn]} />
                </TouchableOpacity>
              ))}
            </View>
            )}
            <TouchableOpacity onPress={() => setSearchOpen(true)} hitSlop={10} style={styles.searchBtn}>
              <Feather name="search" size={ms(20)} color={ink} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.placePill, !onVideo && styles.placePillLight]} onPress={() => router.push('/location-picker' as any)} activeOpacity={0.85}>
            <Ionicons name="location-sharp" size={ms(15)} color={onVideo ? '#fff' : RED} />
            <Text style={[styles.placeText, { color: ink }]} numberOfLines={1}>{placeLabel}</Text>
            <Feather name="chevron-down" size={ms(15)} color={ink} />
            {syncing && <ActivityIndicator size="small" color={ink} style={{ marginLeft: 2, transform: [{ scale: 0.7 }] }} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom bar. Gesture navigation: hug the bottom. 3-button navigation (tall inset): stay above the buttons. */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom >= 40 ? insets.bottom : Math.max(insets.bottom - ms(14), ms(4)) }]}>
        <BarItem label="Thrud" active onPress={refreshThrud}
          icon={(c) => <MaterialCommunityIcons name="play-box-multiple-outline" size={ms(20)} color={c} />} />
        <BarItem label="See All" onPress={() => router.push('/todays-menu' as any)}
          icon={(c) => <Feather name="grid" size={ms(18)} color={c} />} />
        <BarItem label="Cart" onPress={() => router.push('/cart' as any)} badge={itemCount}
          icon={(c) => <Feather name="shopping-cart" size={ms(18)} color={c} />} />
        <BarItem label="E-Plan" onPress={() => router.push('/e-plan' as any)}
          icon={(c) => <MaterialCommunityIcons name="calendar-clock-outline" size={ms(19)} color={c} />} />
      </View>

      <CommentsSheet
        reel={commentsFor}
        userId={userId}
        onClose={() => setCommentsFor(null)}
        onNeedSignIn={() => { setCommentsFor(null); needSignIn(); }}
        onCount={(id, n) => patch(id, { comment_count: n })}
      />

      <SearchSheet
        visible={searchOpen}
        initialQuery={search?.query ?? ''}
        state={location.state || null}
        lga={location.lga || null}
        onClose={() => setSearchOpen(false)}
        onPick={openResults}
      />
    </View>
  );
}

function BarItem({ label, icon, onPress, badge, active }: {
  label: string; icon: (color: string) => ReactNode; onPress: () => void; badge?: number; active?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.barItem} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.barIcon, active && styles.barIconActive]}>
        {icon(active ? '#fff' : foodColors.textPrimary)}
        {!!badge && badge > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text></View>
        )}
      </View>
      <Text style={[styles.barLabel, active && { color: RED }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const ReelItem = memo(function ReelItem({
  reel, menuItem, menuLoading, rating, height, playing, withPlayer, userId, onNeedSignIn, onPatch, onComments, onOpenStore,
}: {
  reel: Reel; menuItem: MenuItem | undefined; menuLoading: boolean; rating: Rating | undefined; height: number;
  playing: boolean; withPlayer: boolean; userId: string | null;
  onNeedSignIn: () => void; onPatch: (id: string, c: Partial<Reel>) => void;
  onComments: (r: Reel) => void; onOpenStore: (storeId: string) => void;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem, removeItem, quantityOf } = useCart();
  const dialog = useDialog();
  const [paused, setPaused] = useState(false);
  const inCart = quantityOf(reel.product_id) > 0;   // always the real cart, on every screen
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const busyLike = useRef(false);

  useEffect(() => { if (!playing) setPaused(false); }, [playing]);
  useEffect(() => { if (!withPlayer) { setProgress(0); setStatus('loading'); } }, [withPlayer]);

  const canAdd = !!menuItem && !menuItem.closed && reel.product_in_stock;
  const fav = isFavorite(reel.store_id);

  // "Added to favourites" / "Removed from favourites", same as the restaurant page.
  const [favToast, setFavToast] = useState<string | null>(null);
  useEffect(() => {
    if (!favToast) return;
    const t = setTimeout(() => setFavToast(null), 2000);
    return () => clearTimeout(t);
  }, [favToast]);
  const toggleFav = () => {
    toggleFavorite(reel.store_id);
    setFavToast(fav ? 'Removed from favourites' : 'Added to favourites');
  };

  async function toggleLike() {
    if (!userId) return onNeedSignIn();
    if (busyLike.current) return;
    busyLike.current = true;
    const liked = !reel.liked;
    onPatch(reel.id, { liked, like_count: Math.max(0, reel.like_count + (liked ? 1 : -1)) });
    const { error } = liked
      ? await supabase.from('video_likes').insert({ video_id: reel.id, user_id: userId })
      : await supabase.from('video_likes').delete().eq('video_id', reel.id).eq('user_id', userId);
    if (error && !(liked && error.code === '23505')) {
      onPatch(reel.id, { liked: reel.liked, like_count: reel.like_count });   // undo
    }
    busyLike.current = false;
  }

  // Toggle: first tap adds the meal to the cart, the next tap removes it (after confirming).
  async function toggleCart() {
    if (inCart) {
      const ok = await dialog.confirm({
        title: 'Remove item?',
        message: 'Are you sure you want to remove this item from your cart?',
        confirmText: 'Remove',
        cancelText: 'Cancel',
        destructive: true,
        icon: 'trash-2',
      });
      if (ok) removeItem(reel.product_id);
      return;
    }
    if (!menuItem || !canAdd) return;
    addItem(menuItem, 1);
  }

  async function share() {
    const msg = `${reel.product_name} from ${reel.store_name} — ${naira(reel.product_price_kobo)} on Hemera E-Chop. Order it on the Hemera app!`;
    try {
      await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
    } catch {
      try { await Share.share({ message: msg }); } catch { /* closed */ }
    }
  }

  const lastTap = useRef(0);
  function onTap() {
    const now = Date.now();
    if (now - lastTap.current < 280) {      // double tap = like
      lastTap.current = 0;
      if (!reel.liked) void toggleLike();
      return;
    }
    lastTap.current = now;
    setTimeout(() => { if (lastTap.current === now) setPaused((p) => !p); }, 290);
  }

  const cartLabel = inCart ? 'Added'
    : !reel.product_in_stock ? 'Sold out'
    : !menuItem ? (menuLoading ? '…' : 'Unavailable')
    : menuItem.closed ? 'Closed'
    : 'Add';
  const eta = menuItem?.etaMinutes ?? null;
  const reviews = rating?.reviews ?? 0;

  return (
    <View style={{ height, backgroundColor: '#000' }}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onTap}>
        {reel.product_image ? (
          <Image source={{ uri: reel.product_image }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={withPlayer ? 0 : 2} />
        ) : null}
        {withPlayer && ExpoVideo ? (
          <ReelVideo
            key={attempt}
            url={videoUrl(reel.video_path)}
            play={playing && !paused}
            onProgress={setProgress}
            onStatus={setStatus}
          />
        ) : null}
        {!ExpoVideo && (
          <View style={styles.centerIcon} pointerEvents="none">
            <Text style={styles.updateNote}>Update the Hemera app to watch videos.</Text>
          </View>
        )}
        {withPlayer && playing && status === 'loading' && (
          <View style={styles.centerIcon} pointerEvents="none"><ActivityIndicator color="#fff" size="large" /></View>
        )}
        {paused && status !== 'error' && (
          <View style={styles.centerIcon} pointerEvents="none">
            <View style={styles.playCircle}><Ionicons name="play" size={ms(32)} color="#fff" style={{ marginLeft: 4 }} /></View>
          </View>
        )}
      </Pressable>
      {status === 'error' && withPlayer && (
        <View style={styles.centerIcon} pointerEvents="box-none">
          <TouchableOpacity style={styles.errorBox} onPress={() => { setStatus('loading'); setAttempt((a) => a + 1); }}>
            <Feather name="refresh-cw" size={ms(18)} color="#fff" />
            <Text style={styles.errorText}>Video didn’t load. Tap to retry.</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Right column */}
      <View style={[styles.side, { bottom: ms(62) }]}>
        <TouchableOpacity style={styles.sideBtn} onPress={toggleCart} disabled={!canAdd && !inCart} hitSlop={6}
          accessibilityLabel={inCart ? 'Remove from cart' : 'Add to cart'}>
          <View style={[styles.addCircle, inCart && styles.addCircleOn, !canAdd && !inCart && { opacity: 0.55 }]}>
            <Feather name={inCart ? 'check' : 'shopping-cart'} size={ms(19)} color="#fff" />
          </View>
          <Text style={styles.sideLabel}>{cartLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={toggleLike} hitSlop={6}>
          <Ionicons name={reel.liked ? 'thumbs-up' : 'thumbs-up-outline'} size={ms(28)} color={reel.liked ? BLUE : '#fff'} style={SHADOW} />
          <Text style={styles.sideLabel}>{compact(reel.like_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={() => onComments(reel)} hitSlop={6}>
          <Ionicons name="chatbubble-ellipses" size={ms(28)} color="#fff" style={SHADOW} />
          <Text style={styles.sideLabel}>{compact(reel.comment_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={share} hitSlop={6}>
          <Ionicons name="logo-whatsapp" size={ms(28)} color="#fff" style={SHADOW} />
          <Text style={styles.sideLabel}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <View style={styles.info}>
        <View style={styles.storeRow}>
          <TouchableOpacity onPress={() => onOpenStore(reel.store_id)} activeOpacity={0.85}>
            {reel.store_logo ? (
              <Image source={{ uri: reel.store_logo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}><Text style={styles.avatarLetter}>{reel.store_name?.[0]?.toUpperCase() ?? '?'}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onOpenStore(reel.store_id)} activeOpacity={0.8} style={{ flexShrink: 1 }}>
            <Text style={styles.storeName} numberOfLines={1}>{reel.store_name}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFav} hitSlop={10}
            style={[styles.favCircle, fav && styles.favCircleOn]} accessibilityLabel={fav ? 'Remove from favourites' : 'Add to favourites'}>
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={ms(15)} color={fav ? RED : '#fff'} />
          </TouchableOpacity>
        </View>

        <Text style={styles.mealName} numberOfLines={2}>{reel.product_name}</Text>
        {!!reel.caption && <Text style={styles.caption} numberOfLines={2}>{reel.caption}</Text>}

        <View style={styles.metaRow}>
          <Ionicons name="star" size={ms(13)} color="#fff" style={SHADOW} />
          <Text style={styles.metaStrong}>{reviews > 0 && rating ? rating.rating.toFixed(1) : 'New'}</Text>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>({compactLower(reviews)} rating{reviews === 1 ? '' : 's'})</Text>
          </View>
          {eta != null && (
            <>
              <View style={styles.metaDivider} />
              <View style={[styles.metaPill, styles.metaPillRow]}>
                <Feather name="clock" size={ms(12)} color="#fff" />
                <Text style={styles.metaPillText}>{eta} mins</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.priceRow}>
          <View style={styles.pricePill}><Text style={styles.priceText}>{naira(reel.product_price_kobo)}</Text></View>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressTrack} pointerEvents="none">
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      {favToast && (
        <View style={styles.favToast} pointerEvents="none">
          <Feather name="heart" size={ms(14)} color="#fff" />
          <Text style={styles.favToastText}>{favToast}</Text>
        </View>
      )}
    </View>
  );
});

/** One player. Mounted only for the 3-slot window; unmounting releases the player (the video stays in the feed). */
function ReelVideo({ url, play, onProgress, onStatus }: {
  url: string; play: boolean; onProgress: (p: number) => void; onStatus: (s: 'loading' | 'ready' | 'error') => void;
}) {
  const source = useMemo(() => ({ uri: url, useCaching: true }), [url]);
  const player = ExpoVideo.useVideoPlayer(source, (p: any) => {
    p.loop = true;
    p.muted = true;                 // muted until it is the current video
    p.timeUpdateEventInterval = 0.25;
  });

  // Only the current video plays, with sound. Everything else is paused and muted.
  useEffect(() => {
    try {
      player.muted = !play;
      if (play) player.play(); else player.pause();
    } catch { /* player released */ }
  }, [player, play]);

  useEffect(() => {
    const subs = [
      player.addListener?.('timeUpdate', (e: any) => {
        const d = Number(player.duration) || 0;
        if (d > 0) onProgress(Math.min(1, Math.max(0, Number(e?.currentTime ?? 0) / d)));
      }),
      player.addListener?.('statusChange', (e: any) => {
        const s = e?.status;
        onStatus(s === 'readyToPlay' ? 'ready' : s === 'error' ? 'error' : 'loading');
      }),
    ];
    return () => { subs.forEach((s) => { try { s?.remove(); } catch { /* gone */ } }); };
  }, [player, onProgress, onStatus]);

  const VideoView = ExpoVideo.VideoView;
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

// ---------------------------------------------------------------- comments + replies
function CommentsSheet({
  reel, userId, onClose, onNeedSignIn, onCount,
}: { reel: Reel | null; userId: string | null; onClose: () => void; onNeedSignIn: () => void; onCount: (id: string, n: number) => void }) {
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [editing, setEditing] = useState<Comment | null>(null);     // long press → Edit
  const [menuFor, setMenuFor] = useState<Comment | null>(null);     // long press menu
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!reel) return;
    let live = true;
    setComments([]); setErr(null); setLoading(true); setReplyTo(null); setEditing(null); setMenuFor(null); setText('');
    supabase.from('video_comments').select('*')
      .eq('video_id', reel.id).order('created_at', { ascending: true }).limit(400)
      .then(({ data, error }) => {
        if (!live) return;
        if (error) setErr('Could not load comments.');
        setComments((data ?? []) as Comment[]);
        setLoading(false);
      });
    return () => { live = false; };
  }, [reel?.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Top comments newest first; replies under each, oldest first (like a conversation).
  const threads = useMemo(() => {
    const tops = comments.filter((c) => !c.parent_id).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return tops.map((t) => ({ top: t, replies: comments.filter((c) => c.parent_id === t.id) }));
  }, [comments]);

  async function send() {
    if (!reel) return;
    if (!userId) return onNeedSignIn();
    const body = text.trim();
    if (!body) return;
    setSending(true); setErr(null);
    if (editing) {
      // Save the edited text (only your own comment; the database checks).
      const { data, error } = await supabase.from('video_comments').update({ body }).eq('id', editing.id).select('*').single();
      setSending(false);
      if (error || !data) { setErr('Could not save your change. Try again.'); return; }
      setComments((prev) => prev.map((c) => (c.id === editing.id ? (data as Comment) : c)));
      setEditing(null); setText('');
      return;
    }
    const { data, error } = await supabase.from('video_comments')
      .insert({ video_id: reel.id, user_id: userId, body, parent_id: replyTo?.parent_id ?? replyTo?.id ?? null })
      .select('*').single();
    setSending(false);
    if (error) { setErr(error.message.includes('bad_reply') ? 'That comment was deleted.' : 'Could not post. Try again.'); return; }
    const next = [...comments, data as Comment];
    setComments(next); setText(''); setReplyTo(null);
    onCount(reel.id, next.length);
  }

  async function remove(c: Comment) {
    if (!reel) return;
    const { error } = await supabase.from('video_comments').delete().eq('id', c.id);
    if (error) { setErr('Could not delete. Try again.'); return; }
    const next = comments.filter((x) => x.id !== c.id && x.parent_id !== c.id);   // its replies go too
    setComments(next);
    onCount(reel.id, next.length);
  }

  function startEdit(c: Comment) {
    setMenuFor(null); setReplyTo(null);
    setEditing(c); setText(c.body);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function startReply(c: Comment) {
    if (!userId) return onNeedSignIn();
    setEditing(null);
    setReplyTo(c);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // Long press your own comment (like Facebook) → Edit or Delete.
  const Row = ({ c, reply }: { c: Comment; reply?: boolean }) => (
    <Pressable
      onLongPress={c.user_id === userId ? () => { setConfirmDelete(false); setMenuFor(c); } : undefined}
      delayLongPress={450}
      style={({ pressed }) => [styles.comment, reply && styles.reply, pressed && c.user_id === userId && styles.commentPressed]}
    >
      <View style={[styles.commentAvatar, reply && styles.replyAvatar]}>
        <Text style={styles.commentAvatarText}>{(c.author_name ?? 'C')[0].toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.commentName}>
          {c.author_name ?? 'Customer'} <Text style={styles.commentTime}>· {ago(c.created_at)}{c.edited_at ? ' · edited' : ''}</Text>
        </Text>
        <Text style={styles.commentBody}>{c.body}</Text>
        <TouchableOpacity onPress={() => startReply(c)} hitSlop={6}><Text style={styles.replyBtn}>Reply</Text></TouchableOpacity>
      </View>
    </Pressable>
  );

  return (
    <Modal visible={!!reel} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.sheetWrap}>
        {/* Tapping anywhere above the comments closes them */}
        <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel="Close comments" />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{comments.length} comment{comments.length === 1 ? '' : 's'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Feather name="x" size={20} color={foodColors.textPrimary} /></TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator style={{ marginVertical: 30 }} color={BLUE} />
          ) : (
            <FlatList
              data={threads}
              keyExtractor={(t) => t.top.id}
              style={{ maxHeight: 400 }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
              ListEmptyComponent={<Text style={styles.noComments}>No comments yet. Be the first.</Text>}
              renderItem={({ item }) => (
                <View>
                  <Row c={item.top} />
                  {item.replies.map((r) => <Row key={r.id} c={r} reply />)}
                </View>
              )}
            />
          )}
          {!!err && <Text style={styles.sheetErr}>{err}</Text>}
          {editing && (
            <View style={styles.replyingBar}>
              <Text style={styles.replyingText} numberOfLines={1}>Editing your comment</Text>
              <TouchableOpacity onPress={() => { setEditing(null); setText(''); }} hitSlop={8}><Feather name="x" size={15} color={foodColors.textSecondary} /></TouchableOpacity>
            </View>
          )}
          {replyTo && (
            <View style={styles.replyingBar}>
              <Text style={styles.replyingText} numberOfLines={1}>Replying to {replyTo.author_name ?? 'Customer'}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={8}><Feather name="x" size={15} color={foodColors.textSecondary} /></TouchableOpacity>
            </View>
          )}
          <View style={[styles.inputRow, { paddingBottom: insets.bottom + 10 }]}>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder={!userId ? 'Sign in to comment' : editing ? 'Edit your comment…' : replyTo ? 'Write a reply…' : 'Add a comment…'}
              placeholderTextColor={foodColors.textMuted}
              style={styles.input}
              maxLength={300}
              editable={!!userId}
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <TouchableOpacity style={[styles.sendBtn, (!text.trim() || sending) && userId ? { opacity: 0.5 } : null]} onPress={send} disabled={sending || (!!userId && !text.trim())}>
              {sending ? <ActivityIndicator color="#fff" size="small" /> : <Feather name={userId ? 'send' : 'log-in'} size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
          {menuFor && (
            <View style={styles.menuLayer}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuFor(null)} />
              <View style={[styles.menuCard, { paddingBottom: insets.bottom + 10 }]}>
                <Text style={styles.menuQuote} numberOfLines={2}>“{menuFor.body}”</Text>
                {confirmDelete ? (
                  <>
                    <Text style={styles.menuAsk}>Delete this comment?{threads.some((t) => t.top.id === menuFor.id && t.replies.length) ? ' Its replies will be deleted too.' : ''}</Text>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { const c = menuFor; setMenuFor(null); void remove(c); }}>
                      <Feather name="trash-2" size={18} color={foodColors.error} /><Text style={[styles.menuText, { color: foodColors.error }]}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => setConfirmDelete(false)}>
                      <Feather name="x" size={18} color={foodColors.textSecondary} /><Text style={styles.menuText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.menuItem} onPress={() => startEdit(menuFor)}>
                      <Feather name="edit-2" size={18} color={foodColors.textPrimary} /><Text style={styles.menuText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => setConfirmDelete(true)}>
                      <Feather name="trash-2" size={18} color={foodColors.error} /><Text style={[styles.menuText, { color: foodColors.error }]}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => setMenuFor(null)}>
                      <Feather name="x" size={18} color={foodColors.textSecondary} /><Text style={styles.menuText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------- search: videos
// Searches Thrud videos by meal, restaurant, food type or caption (your state first). Tap a result
// to watch the matching videos as reels, starting from that one — you stay inside Thrud.
function SearchSheet({ visible, initialQuery, state, lga, onClose, onPick }: {
  visible: boolean; initialQuery: string; state: string | null; lga: string | null;
  onClose: () => void; onPick: (query: string, items: Reel[], start: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const reqId = useRef(0);

  useEffect(() => { if (visible) setQ(initialQuery); else { setQ(''); setResults([]); } }, [visible]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Search as you type (after a short pause); only the latest request counts.
  useEffect(() => {
    if (!visible) return;
    const term = q.trim();
    if (term.length < 2) { setResults([]); setLoading(false); setFailed(false); return; }
    const id = ++reqId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc('hemera_thrud_search', { p_query: term, p_state: state, p_lga: lga, p_limit: 30 });
      if (id !== reqId.current) return;
      setFailed(!!error);
      setResults(error ? [] : ((data ?? []) as Reel[]));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [q, visible, state, lga]);

  if (!visible) return null;
  const term = q.trim();
  return (
    <Modal visible transparent={false} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={[styles.searchRoot, { paddingTop: insets.top + 8 }]}>
        <StatusBar style="dark" />
        <View style={styles.searchHead}>
          <TouchableOpacity onPress={onClose} hitSlop={10}><Feather name="chevron-left" size={24} color={foodColors.textPrimary} /></TouchableOpacity>
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color={foodColors.textMuted} />
            <TextInput
              autoFocus
              value={q}
              onChangeText={setQ}
              placeholder="Search videos: meal, restaurant…"
              placeholderTextColor={foodColors.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => { if (results.length) onPick(term, results, 0); }}
            />
            {loading ? <ActivityIndicator size="small" color={BLUE} /> : !!q && (
              <TouchableOpacity onPress={() => setQ('')} hitSlop={8}><Feather name="x-circle" size={16} color={foodColors.textMuted} /></TouchableOpacity>
            )}
          </View>
        </View>
        {term.length < 2 ? (
          <Text style={styles.searchHint}>Type a meal or restaurant name to find its videos.</Text>
        ) : failed ? (
          <Text style={styles.searchHint}>Couldn’t search. Check your internet and try again.</Text>
        ) : !loading && results.length === 0 ? (
          <Text style={styles.searchHint}>No videos found for “{term}”.</Text>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(r) => r.id}
            numColumns={3}
            keyboardShouldPersistTaps="handled"
            columnWrapperStyle={{ gap: 8 }}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 20, gap: 8 }}
            renderItem={({ item, index }) => (
              <TouchableOpacity style={styles.resultTile} activeOpacity={0.85} onPress={() => onPick(term, results, index)}>
                {item.product_image ? <Image source={{ uri: item.product_image }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
                <View style={styles.resultShade} />
                <View style={styles.resultPlay}><Ionicons name="play" size={14} color="#fff" /></View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultMeal} numberOfLines={2}>{item.product_name}</Text>
                  <Text style={styles.resultStore} numberOfLines={1}>{item.store_name}</Text>
                  <Text style={styles.resultLikes}>👍 {compact(item.like_count)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  favToast: {
    position: 'absolute', top: '38%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: ms(8),
    backgroundColor: 'rgba(17,17,17,0.88)', paddingHorizontal: ms(16), paddingVertical: ms(10), borderRadius: ms(22),
  },
  favToastText: { fontSize: ms(13), fontFamily: fonts.poppins.semiBold, color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(37,93,222,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { color: foodColors.textPrimary, fontFamily: fonts.poppins.semiBold, fontSize: ms(15), textAlign: 'center' },
  emptyText: { color: foodColors.textSecondary, fontFamily: fonts.poppins.regular, fontSize: ms(12.5), textAlign: 'center' },
  retry: { marginTop: 8, backgroundColor: BLUE, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: '#fff', fontFamily: fonts.poppins.semiBold, fontSize: ms(13) },
  moreRetry: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, backgroundColor: '#000' },
  moreRetryText: { color: '#fff', fontFamily: fonts.poppins.medium, fontSize: ms(12) },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: ms(12), alignItems: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: ms(2), flex: 1 },
  backBtn: { paddingRight: ms(2) },
  logo: { width: ms(38), height: ms(38) },
  noShadow: { textShadowColor: 'transparent' },
  tabs: { flexDirection: 'row', gap: ms(18) },
  searchPill: { flexDirection: 'row', alignItems: 'center', gap: ms(6), maxWidth: '55%', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: ms(16), paddingHorizontal: ms(12), paddingVertical: ms(5), borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  searchPillText: { flexShrink: 1, color: '#fff', fontFamily: fonts.poppins.semiBold, fontSize: ms(12.5) },
  tabBtn: { alignItems: 'center' },
  tabText: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.poppins.semiBold, fontSize: ms(13.5), ...SHADOW },
  tabLine: { marginTop: 3, height: 3, width: '100%', borderRadius: 2, backgroundColor: 'transparent' },
  tabLineOn: { backgroundColor: RED },
  searchBtn: { flex: 1, alignItems: 'flex-end' },
  placePill: {
    marginTop: ms(8), flexDirection: 'row', alignItems: 'center', gap: ms(6), maxWidth: '70%',
    backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: ms(16), paddingHorizontal: ms(11), paddingVertical: ms(4),
  },
  placePillLight: { backgroundColor: foodColors.surface, borderColor: foodColors.border },
  placeText: { color: '#fff', fontFamily: fonts.poppins.medium, fontSize: ms(11.5) },

  centerIcon: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playCircle: { width: ms(64), height: ms(64), borderRadius: ms(32), backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  updateNote: { color: '#fff', fontFamily: fonts.poppins.semiBold, fontSize: ms(13), backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, overflow: 'hidden' },
  errorBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  errorText: { color: '#fff', fontFamily: fonts.poppins.medium, fontSize: ms(12.5) },

  side: { position: 'absolute', right: ms(10), alignItems: 'center', gap: ms(13) },
  sideBtn: { alignItems: 'center' },
  sideLabel: { color: '#fff', fontSize: ms(11), fontFamily: fonts.poppins.semiBold, marginTop: 2, ...SHADOW },
  addCircle: { width: ms(42), height: ms(42), borderRadius: ms(21), backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  addCircleOn: { backgroundColor: BLUE, borderColor: BLUE },
  favCircle: { width: ms(28), height: ms(28), borderRadius: ms(14), marginLeft: ms(4), borderWidth: 1.5, borderColor: '#fff', backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  favCircleOn: { backgroundColor: '#fff' },

  info: { position: 'absolute', left: ms(14), right: ms(66), bottom: ms(36) },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: ms(8) },
  avatar: { width: ms(48), height: ms(48), borderRadius: ms(24), borderWidth: 2, borderColor: '#fff', backgroundColor: '#111' },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontFamily: fonts.poppins.bold, fontSize: ms(18) },
  storeName: { color: '#fff', fontFamily: fonts.poppins.semiBold, fontSize: ms(13.5), ...SHADOW },
  mealName: { color: '#fff', fontFamily: fonts.poppins.bold, fontSize: ms(16.5), lineHeight: ms(21), marginTop: ms(8), ...SHADOW },
  caption: { color: '#fff', fontFamily: fonts.poppins.regular, fontSize: ms(11.5), marginTop: 2, ...SHADOW },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: ms(5), marginTop: ms(7), flexWrap: 'wrap' },
  metaStrong: { color: '#fff', fontFamily: fonts.poppins.semiBold, fontSize: ms(12), ...SHADOW },
  metaPill: { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: ms(12), paddingHorizontal: ms(8), paddingVertical: ms(2) },
  metaPillRow: { flexDirection: 'row', alignItems: 'center', gap: ms(5) },
  metaPillText: { color: '#fff', fontFamily: fonts.poppins.medium, fontSize: ms(11) },
  metaDivider: { width: 1, height: ms(15), backgroundColor: 'rgba(255,255,255,0.7)', marginHorizontal: ms(6) },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: ms(9) },
  pricePill: { backgroundColor: RED, borderRadius: ms(16), paddingHorizontal: ms(11), paddingVertical: ms(4) },
  priceText: { color: '#fff', fontFamily: fonts.poppins.bold, fontSize: ms(14.5) },

  progressTrack: { position: 'absolute', left: ms(24), right: ms(24), bottom: ms(28), height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: '#fff' },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: foodColors.surface, paddingTop: ms(7),
    borderTopLeftRadius: ms(22), borderTopRightRadius: ms(22), marginTop: -ms(22),
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: -3 }, elevation: 12,
  },
  barItem: { flex: 1, alignItems: 'center', gap: ms(2) },
  barIcon: { width: ms(42), height: ms(30), borderRadius: ms(15), backgroundColor: foodColors.background, alignItems: 'center', justifyContent: 'center' },
  barIconActive: { backgroundColor: RED },
  barLabel: { color: foodColors.textSecondary, fontFamily: fonts.poppins.semiBold, fontSize: ms(10.5) },
  badge: { position: 'absolute', top: -5, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10.5, fontFamily: fonts.poppins.bold },

  sheetBackdrop: { flex: 1 },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', marginTop: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  sheetTitle: { fontFamily: fonts.poppins.semiBold, fontSize: ms(14), color: foodColors.textPrimary },
  noComments: { textAlign: 'center', color: foodColors.textSecondary, fontFamily: fonts.poppins.regular, fontSize: ms(13), marginVertical: 28 },
  comment: { flexDirection: 'row', gap: 10, paddingVertical: 8, alignItems: 'flex-start' },
  reply: { paddingLeft: 42, paddingVertical: 6 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(37,93,222,0.1)', alignItems: 'center', justifyContent: 'center' },
  replyAvatar: { width: 26, height: 26, borderRadius: 13 },
  commentAvatarText: { color: BLUE, fontFamily: fonts.poppins.bold, fontSize: 12 },
  commentName: { fontFamily: fonts.poppins.semiBold, fontSize: ms(12), color: foodColors.textPrimary },
  commentTime: { fontFamily: fonts.poppins.regular, color: foodColors.textMuted },
  commentBody: { fontFamily: fonts.poppins.regular, fontSize: ms(13), color: '#333', marginTop: 1 },
  commentPressed: { backgroundColor: foodColors.background, borderRadius: 10 },
  menuLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end', borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' },
  menuCard: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 14, paddingHorizontal: 16 },
  menuQuote: { fontFamily: fonts.poppins.regular, fontSize: ms(12.5), color: foodColors.textSecondary, marginBottom: 6 },
  menuAsk: { fontFamily: fonts.poppins.semiBold, fontSize: ms(13), color: foodColors.textPrimary, marginVertical: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  menuText: { fontFamily: fonts.poppins.medium, fontSize: ms(14), color: foodColors.textPrimary },
  replyBtn: { fontFamily: fonts.poppins.semiBold, fontSize: ms(11), color: foodColors.textSecondary, marginTop: 3 },
  replyingBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: foodColors.background },
  replyingText: { flex: 1, fontFamily: fonts.poppins.medium, fontSize: ms(11.5), color: foodColors.textSecondary },
  sheetErr: { color: '#DC2626', fontSize: 12, paddingHorizontal: 16, fontFamily: fonts.poppins.regular },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  input: { flex: 1, backgroundColor: foodColors.background, borderRadius: 20, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 7, fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textPrimary },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },

  searchRoot: { flex: 1, backgroundColor: foodColors.background },
  searchHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: foodColors.surface, borderRadius: 14, borderWidth: 1, borderColor: foodColors.border, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: Platform.OS === 'ios' ? 11 : 8, fontFamily: fonts.poppins.regular, fontSize: ms(13), color: foodColors.textPrimary },
  resultTile: { flex: 1 / 3, aspectRatio: 0.62, borderRadius: 12, overflow: 'hidden', backgroundColor: '#222' },
  resultShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', backgroundColor: 'rgba(0,0,0,0.45)' },
  resultPlay: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  resultInfo: { position: 'absolute', left: 7, right: 7, bottom: 6 },
  resultMeal: { color: '#fff', fontFamily: fonts.poppins.semiBold, fontSize: ms(11.5), lineHeight: ms(14) },
  resultStore: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.poppins.regular, fontSize: ms(10) },
  resultLikes: { color: '#fff', fontFamily: fonts.poppins.medium, fontSize: ms(10), marginTop: 1 },
  searchHint: { textAlign: 'center', marginTop: 40, paddingHorizontal: 30, fontFamily: fonts.poppins.regular, fontSize: ms(12.5), color: foodColors.textSecondary },
});
