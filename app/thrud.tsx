// Thrud — short videos (max 15 s) of E-Chop meals, shown like reels.
// Restaurant picture + Favourite (instead of Follow), Like, Comments, Add to cart (adds the meal, not the video).
// Only videos Hemera has approved appear here (database: hemera_thrud_feed).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text,
  TextInput, TouchableOpacity, View, useWindowDimensions, type ViewToken,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// expo-video is a native module: an app build without it would crash on import, so load it carefully.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ExpoVideo: any = (() => { try { return require('expo-video'); } catch { return null; } })();
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { useFavorites } from '../src/context/FavoritesContext';
import { useAllMenuItems } from '../src/hooks/useFood';
import type { MenuItem } from '../src/constants/foodData';
import { fonts } from '../src/constants/typography';
import { ms } from '../src/utils/responsive';

const BLUE = '#255DDE';

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

const naira = (kobo: number) => `₦${Math.round((kobo ?? 0) / 100).toLocaleString()}`;
const videoUrl = (path: string) => supabase.storage.from('product-videos').getPublicUrl(path).data.publicUrl;
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

function ago(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function ThrudScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const [pageH, setPageH] = useState(winH);
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const { itemCount } = useCart();
  const { items: menu } = useAllMenuItems();
  const menuById = useMemo(() => new Map(menu.map((m) => [m.id, m])), [menu]);

  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(true);
  const [commentsFor, setCommentsFor] = useState<Reel | null>(null);
  const loadingMore = useRef(false);
  const reachedEnd = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: e } = await supabase.rpc('hemera_thrud_feed', { p_limit: 15 });
    if (e) setError('Could not load videos. Pull down or try again.');
    else {
      setReels((data ?? []) as Reel[]);
      reachedEnd.current = (data ?? []).length < 15;
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

  const patch = useCallback((id: string, change: Partial<Reel>) => {
    setReels((prev) => prev.map((r) => (r.id === id ? { ...r, ...change } : r)));
  }, []);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.index != null) setActive(first.index);
  }).current;

  const needSignIn = useCallback(() => router.push('/auth' as any), [router]);

  return (
    <View style={styles.root} onLayout={(e) => setPageH(e.nativeEvent.layout.height)}>
      <StatusBar style="light" />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#fff" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={() => { setLoading(true); void load(); }}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : reels.length === 0 ? (
        <View style={styles.center}>
          <Feather name="film" size={40} color="rgba(255,255,255,0.6)" />
          <Text style={styles.emptyTitle}>No videos yet</Text>
          <Text style={styles.emptyText}>Restaurants' meal videos will show here once they're approved.</Text>
        </View>
      ) : (
        <FlatList
          data={reels}
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
              height={pageH}
              playing={focused && index === active && !commentsFor}
              nearby={Math.abs(index - active) <= 1}
              bottomInset={insets.bottom}
              userId={userId}
              onNeedSignIn={needSignIn}
              onPatch={patch}
              onComments={() => setCommentsFor(item)}
              onOpenStore={() => router.push(`/partner/${item.store_id}` as any)}
            />
          )}
        />
      )}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + ms(6) }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.topBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/echop' as any))} hitSlop={10}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Thrud</Text>
        <TouchableOpacity style={styles.topBtn} onPress={() => router.push('/cart' as any)} hitSlop={10}>
          <Feather name="shopping-bag" size={21} color="#fff" />
          {itemCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text></View>
          )}
        </TouchableOpacity>
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

function ReelItem({
  reel, menuItem, height, playing, nearby, bottomInset, userId, onNeedSignIn, onPatch, onComments, onOpenStore,
}: {
  reel: Reel; menuItem: MenuItem | undefined; height: number; playing: boolean; nearby: boolean; bottomInset: number; userId: string | null;
  onNeedSignIn: () => void; onPatch: (id: string, c: Partial<Reel>) => void; onComments: () => void; onOpenStore: () => void;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem } = useCart();
  const [paused, setPaused] = useState(false);
  const [added, setAdded] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const busyLike = useRef(false);

  useEffect(() => { if (!playing) setPaused(false); }, [playing]);

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

  const cartLabel = !menuItem ? 'Not available' : menuItem.closed ? 'Restaurant closed' : !reel.product_in_stock ? 'Sold out' : added ? 'Added to cart' : 'Add to cart';

  return (
    <View style={{ height, backgroundColor: '#000' }}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onTap}>
        {nearby && ExpoVideo ? (
          <ReelVideo url={videoUrl(reel.video_path)} play={playing && !paused} />
        ) : reel.product_image ? (
          <Image source={{ uri: reel.product_image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        {!ExpoVideo && (
          <View style={styles.pauseIcon} pointerEvents="none">
            <Text style={styles.updateNote}>Update the Hemera app to watch videos.</Text>
          </View>
        )}
        {paused && (
          <View style={styles.pauseIcon} pointerEvents="none"><Ionicons name="play" size={54} color="rgba(255,255,255,0.85)" /></View>
        )}
      </Pressable>

      <View style={styles.shadeBottom} pointerEvents="none" />

      {/* Right column */}
      <View style={[styles.side, { bottom: bottomInset + ms(150) }]}>
        <View style={styles.avatarWrap}>
          <TouchableOpacity onPress={onOpenStore} activeOpacity={0.85}>
            {reel.store_logo ? (
              <Image source={{ uri: reel.store_logo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}><Text style={styles.avatarLetter}>{reel.store_name?.[0]?.toUpperCase() ?? '?'}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleFavorite(reel.store_id)} style={[styles.favBadge, fav && styles.favBadgeOn]} hitSlop={8}>
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={12} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.sideLabelSmall}>{fav ? 'Favourite' : 'Add to\nfavourites'}</Text>

        <TouchableOpacity style={styles.sideBtn} onPress={toggleLike} hitSlop={6}>
          <Ionicons name={reel.liked ? 'heart' : 'heart-outline'} size={32} color={reel.liked ? '#FF3B5C' : '#fff'} />
          <Text style={styles.sideCount}>{compact(reel.like_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={onComments} hitSlop={6}>
          <Ionicons name="chatbubble-ellipses-outline" size={30} color="#fff" />
          <Text style={styles.sideCount}>{compact(reel.comment_count)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={addToCart} disabled={!canAdd} hitSlop={6}>
          <View style={[styles.cartCircle, !canAdd && { opacity: 0.5 }]}>
            <Feather name={added ? 'check' : 'shopping-cart'} size={20} color="#fff" />
          </View>
          <Text style={styles.sideCount}>Cart</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <View style={[styles.info, { paddingBottom: bottomInset + ms(16) }]}>
        <TouchableOpacity onPress={onOpenStore} activeOpacity={0.8}>
          <Text style={styles.storeName} numberOfLines={1}>{reel.store_name}</Text>
        </TouchableOpacity>
        {!!reel.caption && (
          <Text style={styles.caption} numberOfLines={captionOpen ? 6 : 2} onPress={() => setCaptionOpen((o) => !o)}>{reel.caption}</Text>
        )}
        <View style={styles.productCard}>
          {reel.product_image ? <Image source={{ uri: reel.product_image }} style={styles.productImg} /> : <View style={[styles.productImg, { backgroundColor: '#333' }]} />}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.productName} numberOfLines={1}>{reel.product_name}</Text>
            <Text style={styles.productPrice}>{naira(reel.product_price_kobo)}</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, !canAdd && styles.addBtnOff, added && styles.addBtnDone]} onPress={addToCart} disabled={!canAdd}>
            <Feather name={added ? 'check' : 'plus'} size={14} color="#fff" />
            <Text style={styles.addText}>{cartLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ReelVideo({ url, play }: { url: string; play: boolean }) {
  const player = ExpoVideo.useVideoPlayer(url, (p: any) => { p.loop = true; });
  useEffect(() => {
    try { if (play) player.play(); else player.pause(); } catch { /* player released */ }
  }, [player, play]);
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  emptyTitle: { color: '#fff', fontFamily: fonts.poppins.semiBold, fontSize: ms(16) },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.poppins.regular, fontSize: ms(13), textAlign: 'center' },
  retry: { marginTop: 8, backgroundColor: BLUE, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: '#fff', fontFamily: fonts.poppins.semiBold, fontSize: ms(13) },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  topBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: '#fff', fontFamily: fonts.poppins.bold, fontSize: ms(17), textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 6 },
  badge: { position: 'absolute', top: 3, right: 1, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.poppins.bold },

  updateNote: { color: '#fff', fontFamily: fonts.poppins.semiBold, fontSize: ms(13), backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, overflow: 'hidden' },
  pauseIcon: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  shadeBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%', backgroundColor: 'rgba(0,0,0,0.28)' },

  side: { position: 'absolute', right: 10, alignItems: 'center', gap: ms(16) },
  avatarWrap: { alignItems: 'center', marginBottom: 2 },
  avatar: { width: ms(46), height: ms(46), borderRadius: ms(23), borderWidth: 2, borderColor: '#fff', backgroundColor: '#222' },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontFamily: fonts.poppins.bold, fontSize: ms(18) },
  favBadge: { position: 'absolute', bottom: -8, width: 22, height: 22, borderRadius: 11, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  favBadgeOn: { backgroundColor: '#FF3B5C' },
  sideLabelSmall: { color: '#fff', fontSize: ms(9.5), fontFamily: fonts.poppins.medium, textAlign: 'center', marginTop: -6, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  sideBtn: { alignItems: 'center' },
  sideCount: { color: '#fff', fontSize: ms(11.5), fontFamily: fonts.poppins.semiBold, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  cartCircle: { width: ms(42), height: ms(42), borderRadius: ms(21), backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },

  info: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingLeft: 14, paddingRight: 74 },
  storeName: { color: '#fff', fontFamily: fonts.poppins.bold, fontSize: ms(15), textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  caption: { color: '#fff', fontFamily: fonts.poppins.regular, fontSize: ms(12.5), marginTop: 3, lineHeight: ms(18), textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  productCard: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  productImg: { width: ms(42), height: ms(42), borderRadius: 10 },
  productName: { color: '#fff', fontFamily: fonts.poppins.semiBold, fontSize: ms(13) },
  productPrice: { color: '#fff', fontFamily: fonts.poppins.bold, fontSize: ms(13), opacity: 0.95 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BLUE, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 8 },
  addBtnOff: { backgroundColor: 'rgba(255,255,255,0.25)' },
  addBtnDone: { backgroundColor: '#16A34A' },
  addText: { color: '#fff', fontFamily: fonts.poppins.semiBold, fontSize: ms(11) },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
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
