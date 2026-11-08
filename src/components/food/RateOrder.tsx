// "Rate your experience": shown on a DELIVERED E-Chop order (rates the restaurant) or E-Wash order
// (rates the laundry partner). One review per order, final — after sending, the customer sees what
// they wrote (and the partner's reply). The database checks the order is theirs and delivered
// (hemera_submit_review) and the partner's rating is the average of all reviews.
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { ms } from '../../utils/responsive';

const BLUE = foodColors.badgeBlue;
const STAR = '#F5A524';

type Saved = { rating: number; comment: string | null; reply: string | null; created_at: string };
type Service = 'echop' | 'ewash';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** This order's review: from hemera_my_reviews, or straight from the reviews table as a fallback. */
async function loadMyReview(orderId: string): Promise<Saved | null> {
  const toSaved = (r: any): Saved => ({ rating: Number(r.rating) || 0, comment: r.comment ?? null, reply: r.reply ?? null, created_at: r.created_at });
  const { data, error } = await supabase.rpc('hemera_my_reviews', { p_order_ids: [orderId] });
  if (!error && Array.isArray(data)) return data.length ? toSaved(data[0]) : null;
  const { data: rows } = await supabase.from('store_reviews').select('rating, comment, reply, created_at').eq('order_id', orderId).limit(1);
  return rows && rows.length ? toSaved(rows[0]) : null;
}

export function RateOrder({ orderId, service = 'echop', onSaved }: { orderId: string; service?: Service; onSaved?: () => void }) {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const partner = service === 'ewash' ? 'laundry partner' : 'restaurant';

  // The saved review (with the partner's reply). Reloads each time the order page opens.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const row = await loadMyReview(orderId);
      if (cancelled) return;
      if (row) setSaved(row);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orderId]);

  const submit = async () => {
    if (busy) return;
    if (rating < 1) { setMessage({ ok: false, text: 'Tap a star to rate your experience.' }); return; }
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.rpc('hemera_submit_review', {
        p_order_id: orderId,
        p_rating: rating,
        p_comment: comment.trim() || null,
      });
      if (error) {
        const raw = error.message ?? '';
        // Already reviewed (e.g. from another phone): show it instead of an error.
        if (raw.startsWith('already_reviewed')) {
          const row = await loadMyReview(orderId);
          if (row) setSaved(row);
        }
        setMessage({ ok: false, text: raw.includes(':') ? raw.split(':').slice(1).join(':').trim() : 'Could not send your review. Check your connection and try again.' });
        return;
      }
      setSaved({ rating, comment: comment.trim() || null, reply: null, created_at: new Date().toISOString() });
      setMessage({ ok: true, text: `Thank you! Your review has been saved and added to the ${partner}’s rating.` });
      onSaved?.();
    } catch {
      setMessage({ ok: false, text: 'Could not send your review. Check your connection and try again.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <View style={[styles.card, styles.loadingCard]}><ActivityIndicator color={BLUE} size="small" /></View>;
  }

  return (
    <View style={styles.card}>
      <View style={styles.deliveredRow}>
        <View style={styles.deliveredIcon}><Feather name="check" size={ms(15)} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.deliveredTitle}>Order Delivered</Text>
          <Text style={styles.deliveredSub}>Successfully delivered</Text>
        </View>
        {saved && (
          <View style={styles.reviewedPill}>
            <Feather name="check-circle" size={ms(12)} color={foodColors.success} />
            <Text style={styles.reviewedText}>Reviewed</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {saved ? (
        <>
          <Text style={styles.title}>Your review</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Ionicons key={n} name={n <= saved.rating ? 'star' : 'star-outline'} size={ms(22)} color={n <= saved.rating ? STAR : foodColors.textMuted} />
            ))}
            <Text style={styles.starLabel}>{LABELS[saved.rating]}</Text>
          </View>
          {saved.comment ? <Text style={styles.comment}>“{saved.comment}”</Text> : <Text style={styles.noComment}>No written review.</Text>}
          {saved.reply ? (
            <View style={styles.replyBox}>
              <Text style={styles.replyLabel}>{service === 'ewash' ? 'Laundry partner replied' : 'Restaurant replied'}</Text>
              <Text style={styles.replyText}>{saved.reply}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.title}>How was your experience with this {partner}?</Text>
          <Text style={styles.sub}>Tap a star to rate your experience</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => { setRating(n); setMessage(null); }} disabled={busy}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }} accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}>
                <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={ms(30)} color={n <= rating ? STAR : foodColors.textMuted} />
              </TouchableOpacity>
            ))}
            {rating > 0 && <Text style={styles.starLabel}>{LABELS[rating]}</Text>}
          </View>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Write your review (optional)"
            placeholderTextColor={foodColors.textMuted}
            multiline
            maxLength={500}
            editable={!busy}
          />
          <TouchableOpacity style={[styles.primary, (busy || rating < 1) && { opacity: 0.6 }]} onPress={submit} disabled={busy} activeOpacity={0.85}>
            {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryText}>Submit Review</Text>}
          </TouchableOpacity>
        </>
      )}

      {message && (
        <View style={[styles.message, { backgroundColor: message.ok ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.08)' }]}>
          <Feather name={message.ok ? 'check-circle' : 'alert-circle'} size={ms(14)} color={message.ok ? foodColors.success : foodColors.error} />
          <Text style={[styles.messageText, { color: message.ok ? '#15803D' : foodColors.error }]}>{message.text}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: foodColors.surface, borderRadius: ms(16), padding: ms(16), marginBottom: ms(16), borderWidth: 1, borderColor: foodColors.border },
  loadingCard: { alignItems: 'center', paddingVertical: ms(22) },
  deliveredRow: { flexDirection: 'row', alignItems: 'center', gap: ms(10) },
  deliveredIcon: { width: ms(30), height: ms(30), borderRadius: ms(15), backgroundColor: foodColors.success, alignItems: 'center', justifyContent: 'center' },
  deliveredTitle: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  deliveredSub: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  reviewedPill: { flexDirection: 'row', alignItems: 'center', gap: ms(4), backgroundColor: 'rgba(52,199,89,0.12)', borderRadius: ms(12), paddingHorizontal: ms(8), paddingVertical: ms(3) },
  reviewedText: { fontSize: ms(11), fontFamily: fonts.poppins.semiBold, color: '#15803D' },
  divider: { height: 1, backgroundColor: foodColors.border, marginVertical: ms(12) },
  title: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  sub: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: ms(2) },
  stars: { flexDirection: 'row', alignItems: 'center', gap: ms(8), marginTop: ms(10), marginBottom: ms(4) },
  starLabel: { marginLeft: ms(4), fontSize: ms(12), fontFamily: fonts.poppins.medium, color: foodColors.textSecondary },
  input: {
    minHeight: ms(76), borderRadius: ms(12), borderWidth: 1, borderColor: foodColors.border, backgroundColor: foodColors.background,
    padding: ms(12), marginTop: ms(10), fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textPrimary, textAlignVertical: 'top',
  },
  primary: { marginTop: ms(12), backgroundColor: BLUE, borderRadius: ms(12), paddingVertical: ms(13), alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: ms(13.5), fontFamily: fonts.poppins.semiBold },
  comment: { marginTop: ms(6), fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textPrimary, lineHeight: ms(19) },
  noComment: { marginTop: ms(6), fontSize: ms(12), fontFamily: fonts.poppins.regular, color: foodColors.textMuted },
  replyBox: { marginTop: ms(10), backgroundColor: foodColors.background, borderRadius: ms(10), padding: ms(10) },
  replyLabel: { fontSize: ms(11), fontFamily: fonts.poppins.semiBold, color: foodColors.textSecondary },
  replyText: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: foodColors.textPrimary, marginTop: ms(2) },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: ms(6), borderRadius: ms(10), padding: ms(10), marginTop: ms(10) },
  messageText: { flex: 1, fontSize: ms(12), fontFamily: fonts.poppins.medium },
});
