// Thrud — short videos (max 15 s) of E-Chop meals, shown like reels.
// For You (all videos) / Following (your favourite restaurants). Restaurant picture + Favourite heart
// (instead of Follow), Like, Comments, Share, Add to cart (adds the meal, not the video).
// Only videos Hemera has approved appear here (database: hemera_thrud_feed).
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, Share, StyleSheet, Text,
  TextInput, TouchableOpacity, View, type ViewToken,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
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
import type { MenuItem } from '../src/constants/foodData';
import { fonts } from '../src/constants/typography';
import { ms } from '../src/utils/responsive';

const BLUE = '#255DDE';
const RED = foodColors.primary;     // #E23A2E
const SHADOW = { textShadowColor: 'rgba(0,0,0,0.55)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } };

type Reel = {
  id: string;
  video_path: string;
  caption: string | null;
  like_count: number;
  comment_count: number;
  liked: boolean;
  created_at: string;
  store_id: string;
  store_name: string;
  store_logo: string | null;
  product_id: string;
  product_name: string;
  product_price_kobo: number;
  product_in_stock: boolean;
  product_image: string | null;
};

type Comment = { id: string; author_name: string | null; body: string; created_at: string; user_id: string };
type Rating = { rating: number; reviews: number };
type Tab = 'forYou' | 'following';

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

export default function ThrudScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pageH, setPageH] = useState(0);
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const { itemCount } = useCart();
  const { favoriteIds } = useFavorites();
  const { formatted: placeLabel } = useLocation();
  const { items: menu, loading: menuLoading } = useAllMenuItems();
  const menuById = useMemo(() => new Map(menu.map((m) => [m.id, m])), [menu]);

  const [reels, setReels] = useState<Reel[]>([]);
  const [ratings, setRatings] = useState<Map<string, Rating>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('forYou');
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(true);
  const [commentsFor, setCommentsFor] = useState<Reel | null>(null);
  const loadingMore = useRef(false);
  const reachedEnd = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    const [{ data, error: e }, r] = await Promise.all([
      supabase.rpc('hemera_thrud_feed', { p_limit: 15 }),
      supabase.rpc('hemera_store_ratings'),
    ]);
    if (e) setError('Could not load videos. Try again.');
    else {
      setReels((data ?? []) as Reel[]);
      reachedEnd.current = (data ?? []).length < 15;
    }
    if (Array.isArray(r.data)) {
      setRatings(new Map((r.data as any[]).map((x) => [String(x.store_id), { rating: Number(x.rating) || 0, reviews: Number(x.reviews) || 0 }])));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Pause when leaving the screen.
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));

  const loadMore = useCallback(async () => {
    if (loadingMore.current || reachedEnd.current || reels.length === 0) return;
    loadingMore.current = true;
    const last = reels[reels.length - 1];
    const { data } = await supabase.rpc('hemera_thrud_feed', { p_limit: 15, p_before: last.created_at });
    const more = (data ?? []) as Reel[];
    if (more.length < 15) reachedEnd.current = true;
    setReels((prev) => [...prev, ...more.filter((m) => !prev.some((p) => p.id === m.id))]);
    loadingMore.current = false;
  }, [reels]);

  const shown = useMemo(
    () => (tab === 'following' ? reels.filter((r) => favoriteIds.includes(r.store_id)) : reels),
    [tab, reels, favoriteIds],
  );

  const patch = useCallback((id: string, change: Partial<Reel>) => {
    setReels((prev) => prev.map((r) => (r.id === id ? { ...r, ...change } : r)));
  }, []);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.index != null) setActive(first.index);
  }).current;

  const switchTab = (t: Tab) => { if (t !== tab) { setActive(0); setTab(t); } };
  const needSignIn = useCallback(() => router.push('/auth' as any), [router]);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/echop' as any));

  // Videos: dark screen, light status bar. Loading / empty / error: our light background.
  const onVideo = !loading && !error && shown.length > 0 && pageH > 0;
  const ink = onVideo ? '#fff' : foodColors.textPrimary;

  return (
    <View style={[styles.root, !onVideo && { backgroundColor: foodColors.background }]}>
      <StatusBar style={onVideo ? 'light' : 'dark'} />

      <View style={{ flex: 1 }} onLayout={(e) => setPageH(Math.round(e.nativeEvent.layout.height))}>
        {loading || pageH === 0 ? (
          <View style={styles.center}><ActivityIndicator color={BLUE} /></View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retry} onPress={() => { setLoading(true); void load(); }}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : shown.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.emptyIcon}><Feather name={tab === 'following' ? 'heart' : 'film'} size={30} color={BLUE} /></View>
            <Text style={styles.emptyTitle}>{tab === 'following' ? 'Nothing from your favourites yet' : 'No videos yet'}</Text>
            <Text style={styles.emptyText}>
              {tab === 'following'
                ? 'Tap the heart next to a restaurant’s name to add it to your favourites. Their videos show here.'
                : 'Restaurants’ meal videos will show here once they’re approved.'}
            </Text>
          </View>
        ) : (
          <FlatList
            key={tab}
            data={shown}
            keyExtractor={(r) => r.id}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={pageH}
            getItemLayout={(_, i) => ({ length: pageH, offset: pageH * i, index: i })}
            onViewableItemsChanged={onViewable}
            viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
            onEndReached={loadMore}
            onEndReachedThreshold={2}
            windowSize={3}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            removeClippedSubviews
            renderItem={({ item, index }) => (
              <ReelItem
                reel={item}
                menuItem={menuById.get(item.product_id)}
                menuLoading={menuLoading}
                rating={ratings.get(item.store_id)}
                height={pageH}
                playing={focused && index === active && !commentsFor}
                nearby={Math.abs(index - active) <= 1}
                userId={userId}
                onNeedSignIn={needSignIn}
                onPatch={patch}
                onComments={() => setCommentsFor(item)}
                onOpenStore={() => router.push(`/partner/${item.store_id}` as any)}
              />
            )}
          />
        )}

        {/* Top bar: logo · For You / Following · search, then the location */}
        <View style={[styles.topBar, { paddingTop: insets.top + ms(6) }]} pointerEvents="box-none">
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.brand} onPress={goBack} activeOpacity={0.8} hitSlop={8}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            </TouchableOpacity>
            <View style={styles.tabs}>
              {(['forYou', 'following'] as Tab[]).map((t) => (
                <TouchableOpacity key={t} onPress={() => switchTab(t)} hitSlop={8} style={styles.tabBtn}>
                  <Text style={[styles.tabText, { color: onVideo ? 'rgba(255,255,255,0.72)' : foodColors.textSecondary }, !onVideo && styles.noShadow, tab === t && { color: ink }]}>{t === 'forYou' ? 'For You' : 'Following'}</Text>
                  <View style={[styles.tabLine, tab === t && styles.tabLineOn]} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => router.push('/todays-menu' as any)} hitSlop={10} style={styles.searchBtn}>
              <Feather name="search" size={ms(20)} color={ink} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.placePill, !onVideo && styles.placePillLight]} onPress={() => router.push('/location-picker' as any)} activeOpacity={0.85}>
            <Ionicons name="location-sharp" size={ms(15)} color={onVideo ? '#fff' : RED} />
            <Text style={[styles.placeText, { color: ink }]} numberOfLines={1}>{placeLabel}</Text>
            <Feather name="chevron-down" size={ms(15)} color={ink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom bar */}
      {/* Gesture navigation: hug the bottom. 3-button navigation (tall inset): stay above the buttons. */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom >= 40 ? insets.bottom : Math.max(insets.bottom - ms(14), ms(4)) }]}>
        <BarItem label="E-Plan" onPress={() => router.push('/e-plan' as any)}
          icon={(c) => <MaterialCommunityIcons name="calendar-clock-outline" size={ms(19)} color={c} />} />
        <BarItem label="See All" onPress={() => router.push('/todays-menu' as any)}
          icon={(c) => <Feather name="grid" size={ms(18)} color={c} />} />
        <BarItem label="Cart" primary onPress={() => router.push('/cart' as any)} badge={itemCount}
          icon={(c) => <Feather name="shopping-cart" size={ms(18)} color={c} />} />
        <BarItem label="Wallet" onPress={() => router.push('/wallet' as any)}
          icon={(c) => <Ionicons name="wallet-outline" size={ms(19)} color={c} />} />
      </View>

      <CommentsSheet
        reel={commentsFor}
        userId={userId}
        onClose={() => setCommentsFor(null)}
        onNeedSignIn={() => { setCommentsFor(null); needSignIn(); }}
        onCount={(id, n) => patch(id, { comment_count: n })}
      />
    </View>
  );
}

function BarItem({ label, icon, onPress, badge, primary }: {
  label: string; icon: (color: string) => ReactNode; onPress: () => void; badge?: number; primary?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.barItem} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.barIcon, primary && styles.barIconPrimary]}>
        {icon(primary ? '#fff' : foodColors.textPrimary)}
        {!!badge && badge > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text></View>
        )}
      </View>
      <Text style={[styles.barLabel, primary && { color: BLUE }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ReelItem({
  reel, menuItem, menuLoading, rating, height, playing, nearby, userId, onNeedSignIn, onPatch, onComments, onOpenStore,
}: {
  reel: Reel; menuItem: MenuItem | undefined; menuLoading: boolean; rating: Rating | undefined; height: number;
  playing: boolean; nearby: boolean; userId: string | null;
  onNeedSignIn: () => void; onPatch: (id: string, c: Partial<Reel>) => void; onComments: () => void; onOpenStore: () => void;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem } = useCart();
  const [paused, setPaused] = useState(false);
  const [added, setAdded] = useState(false);
  const [progress, setProgress] = useState(0);
  const busyLike = useRef(false);

  useEffect(() => { if (!playing) setPaused(false); }, [playing]);
  useEffect(() => { if (!nearby) setProgress(0); }, [nearby]);

  const canAdd = !!menuItem && !menuItem.closed && reel.product_in_stock;
  const fav = isFavorite(reel.store_id);

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

  function addToCart() {
    if (!menuItem || !canAdd) return;
    addItem(menuItem, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
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

  const cartLabel = added ? 'Added'
    : !reel.product_in_stock ? 'Sold out'
    : !menuItem ? (menuLoading ? '…' : 'Unavailable')
    : menuItem.closed ? 'Closed'
    : 'Add';
  const eta = menuItem?.etaMinutes ?? null;

  return (
    <View style={{ height, backgroundColor: '#000' }}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onTap}>
        {nearby && ExpoVideo ? (
          <ReelVideo url={videoUrl(reel.video_path)} play={playing && !paused} onProgress={setProgress} />
        ) : reel.product_image ? (
          <Image source={{ uri: reel.product_image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        {!ExpoVideo && (
          <View style={styles.centerIcon} pointerEvents="none">
            <Text style={styles.updateNote}>Update the Hemera app to watch videos.</Text>
          </View>
        )}
        {paused && (
          <View style={styles.centerIcon} pointerEvents="none">
            <View style={styles.playCircle}><Ionicons name="play" size={ms(32)} color="#fff" style={{ marginLeft: 4 }} /></View>
          </View>
        )}
      </Pressable>

      {/* Right column */}
      <View style={[styles.side, { bottom: ms(150) }]}>
        <TouchableOpacity style={styles.sideBtn} onPress={addToCart} disabled={!canAdd} hitSlop={6}>
          <View style={[styles.addCircle, !canAdd && { opacity: 0.55 }, added && { backgroundColor: '#16A34A' }]}>
            <Feather name={added ? 'check' : 'shopping-cart'} size={ms(19)} color="#fff" />
          </View>
          <Text style={styles.sideLabel}>{cartLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={toggleLike} hitSlop={6}>
          <Ionicons name="heart" size={ms(30)} color={reel.liked ? '#FF3B5C' : '#fff'} style={SHADOW} />
          <Text style={styles.sideLabel}>{compact(reel.like_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={onComments} hitSlop={6}>
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
          <TouchableOpacity onPress={onOpenStore} activeOpacity={0.85}>
            {reel.store_logo ? (
              <Image source={{ uri: reel.store_logo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}><Text style={styles.avatarLetter}>{reel.store_name?.[0]?.toUpperCase() ?? '?'}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onOpenStore} activeOpacity={0.8} style={{ flexShrink: 1 }}>
            <Text style={styles.storeName} numberOfLines={1}>{reel.store_name}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleFavorite(reel.store_id)} hitSlop={10} style={{ marginLeft: 6 }}>
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={ms(19)} color={fav ? '#FF3347' : '#fff'} style={SHADOW} />
          </TouchableOpacity>
        </View>

        <Text style={styles.mealName} numberOfLines={2}>{reel.product_name}</Text>
        {!!reel.caption && <Text style={styles.caption} numberOfLines={2}>{reel.caption}</Text>}

        <View style={styles.metaRow}>
          <Ionicons name="star" size={ms(13)} color="#fff" style={SHADOW} />
          {rating && rating.reviews > 0 ? (
            <>
              <Text style={styles.metaStrong}>{rating.rating.toFixed(1)}</Text>
              <View style={styles.metaPill}><Text style={styles.metaPillText}>({compactLower(rating.reviews)} rating{rating.reviews === 1 ? '' : 's'})</Text></View>
            </>
          ) : (
            <View style={styles.metaPill}><Text style={styles.metaPillText}>New</Text></View>
          )}
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
    </View>
  );
}

function ReelVideo({ url, play, onProgress }: { url: string; play: boolean; onProgress: (p: number) => void }) {
  const player = ExpoVideo.useVideoPlayer(url, (p: any) => { p.loop = true; p.timeUpdateEventInterval = 0.25; });
  useEffect(() => {
    try { if (play) player.play(); else player.pause(); } catch { /* player released */ }
  }, [player, play]);
  useEffect(() => {
    const sub = player.addListener?.('timeUpdate', (e: any) => {
      const d = Number(player.duration) || 0;
      if (d > 0) onProgress(Math.min(1, Math.max(0, Number(e?.currentTime ?? 0) / d)));
    });
    return () => { try { sub?.remove(); } catch { /* gone */ } };
  }, [player, onProgress]);
  const VideoView = ExpoVideo.VideoView;
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

function CommentsSheet({
  reel, userId, onClose, onNeedSignIn, onCount,
}: { reel: Reel | null; userId: string | null; onClose: () => void; onNeedSignIn: () => void; onCount: (id: string, n: number) => void }) {
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!reel) return;
    let live = true;
    setComments([]); setErr(null); setLoading(true);
    supabase.from('video_comments').select('id, author_name, body, created_at, user_id')
      .eq('video_id', reel.id).order('created_at', { ascending: false }).limit(200)
      .then(({ data, error }) => {
        if (!live) return;
        if (error) setErr('Could not load comments.');
        setComments((data ?? []) as Comment[]);
        setLoading(false);
      });
    return () => { live = false; };
  }, [reel?.id]);

  async function send() {
    if (!reel) return;
    if (!userId) return onNeedSignIn();
    const body = text.trim();
    if (!body) return;
    setSending(true); setErr(null);
    const { data, error } = await supabase.from('video_comments')
      .insert({ video_id: reel.id, user_id: userId, body })
      .select('id, author_name, body, created_at, user_id').single();
    setSending(false);
    if (error) { setErr('Could not post your comment.'); return; }
    const next = [data as Comment, ...comments];
    setComments(next); setText('');
    onCount(reel.id, reel.comment_count + 1);
  }

  async function remove(c: Comment) {
    if (!reel) return;
    const { error } = await supabase.from('video_comments').delete().eq('id', c.id);
    if (error) return;
    setComments((prev) => prev.filter((x) => x.id !== c.id));
    onCount(reel.id, Math.max(0, reel.comment_count - 1));
  }

  return (
    <Modal visible={!!reel} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior="padding" style={styles.sheetWrap}>
        <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>{comments.length} comment{comments.length === 1 ? '' : 's'}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><Feather name="x" size={20} color="#111" /></TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginVertical: 30 }} color={BLUE} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(c) => c.id}
            style={{ maxHeight: 380 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
            ListEmptyComponent={<Text style={styles.noComments}>No comments yet. Be the first.</Text>}
            renderItem={({ item }) => (
              <View style={styles.comment}>
                <View style={styles.commentAvatar}><Text style={styles.commentAvatarText}>{(item.author_name ?? 'C')[0].toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.commentName}>{item.author_name ?? 'Customer'} <Text style={styles.commentTime}>· {ago(item.created_at)}</Text></Text>
                  <Text style={styles.commentBody}>{item.body}</Text>
                </View>
                {item.user_id === userId && (
                  <TouchableOpacity onPress={() => remove(item)} hitSlop={8}><Feather name="trash-2" size={15} color="#999" /></TouchableOpacity>
                )}
              </View>
            )}
          />
        )}
        {!!err && <Text style={styles.sheetErr}>{err}</Text>}
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={userId ? 'Add a comment…' : 'Sign in to comment'}
            placeholderTextColor="#999"
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(37,93,222,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { color: foodColors.textPrimary, fontFamily: fonts.poppins.semiBold, fontSize: ms(16), textAlign: 'center' },
  emptyText: { color: foodColors.textSecondary, fontFamily: fonts.poppins.regular, fontSize: ms(13), textAlign: 'center' },
  retry: { marginTop: 8, backgroundColor: BLUE, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: '#fff', fontFamily: fonts.poppins.semiBold, fontSize: ms(13) },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: ms(14), alignItems: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: ms(6), flex: 1 },
  logo: { width: ms(30), height: ms(30) },
  noShadow: { textShadowColor: 'transparent' },
  tabs: { flexDirection: 'row', gap: ms(18) },
  tabBtn: { alignItems: 'center' },
  tabText: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.poppins.semiBold, fontSize: ms(13.5), ...SHADOW },
  tabTextOn: { color: '#fff' },
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

  side: { position: 'absolute', right: ms(10), alignItems: 'center', gap: ms(13) },
  sideBtn: { alignItems: 'center' },
  sideLabel: { color: '#fff', fontSize: ms(11), fontFamily: fonts.poppins.semiBold, marginTop: 2, ...SHADOW },
  addCircle: { width: ms(42), height: ms(42), borderRadius: ms(21), backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },

  info: { position: 'absolute', left: ms(14), right: ms(14), bottom: ms(36) },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: ms(8), paddingRight: ms(60) },
  avatar: { width: ms(38), height: ms(38), borderRadius: ms(19), borderWidth: 2, borderColor: '#fff', backgroundColor: '#111' },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontFamily: fonts.poppins.bold, fontSize: ms(15) },
  storeName: { color: '#fff', fontFamily: fonts.poppins.semiBold, fontSize: ms(13.5), ...SHADOW },
  mealName: { color: '#fff', fontFamily: fonts.poppins.bold, fontSize: ms(16.5), lineHeight: ms(21), marginTop: ms(8), paddingRight: ms(60), ...SHADOW },
  caption: { color: '#fff', fontFamily: fonts.poppins.regular, fontSize: ms(11.5), marginTop: 2, paddingRight: ms(60), ...SHADOW },
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
  barIconPrimary: { backgroundColor: BLUE },
  barLabel: { color: foodColors.textSecondary, fontFamily: fonts.poppins.semiBold, fontSize: ms(10.5) },
  badge: { position: 'absolute', top: -5, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10.5, fontFamily: fonts.poppins.bold },

  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', marginTop: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  sheetTitle: { fontFamily: fonts.poppins.semiBold, fontSize: ms(14), color: '#111' },
  noComments: { textAlign: 'center', color: '#888', fontFamily: fonts.poppins.regular, fontSize: ms(13), marginVertical: 28 },
  comment: { flexDirection: 'row', gap: 10, paddingVertical: 9, alignItems: 'flex-start' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8EEFC', alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { color: BLUE, fontFamily: fonts.poppins.bold, fontSize: 13 },
  commentName: { fontFamily: fonts.poppins.semiBold, fontSize: ms(12), color: '#111' },
  commentTime: { fontFamily: fonts.poppins.regular, color: '#999' },
  commentBody: { fontFamily: fonts.poppins.regular, fontSize: ms(13), color: '#333', marginTop: 1 },
  sheetErr: { color: '#DC2626', fontSize: 12, paddingHorizontal: 16, fontFamily: fonts.poppins.regular },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 7, fontSize: ms(13), fontFamily: fonts.poppins.regular, color: '#111' },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
});
