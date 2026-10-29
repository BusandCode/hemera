// "Rate your order": shown on a delivered E-Chop order. One review per order; it can be changed.
// The review shows on the restaurant's page (first name + initial) and in Hemera Business.
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { ms } from '../../utils/responsive';

type Saved = { rating: number; comment: string | null; reply: string | null };

export function RateOrder({ orderId }: { orderId: string }) {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('store_reviews')
        .select('rating, comment, reply')
        .eq('order_id', orderId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setSaved(data as Saved);
        setRating(Number((data as any).rating) || 0);
        setComment(String((data as any).comment ?? ''));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orderId]);

  const submit = async () => {
    if (busy) return;
    if (rating < 1) { setMessage({ ok: false, text: 'Tap the stars to choose a rating.' }); return; }
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
        setMessage({ ok: false, text: raw.includes(':') ? raw.split(':').slice(1).join(':').trim() : 'Could not send your review. Try again.' });
        return;
      }
      setSaved({ rating, comment: comment.trim() || null, reply: saved?.reply ?? null });
      setEditing(false);
      setMessage({ ok: true, text: 'Thanks! Your review is now on the restaurant’s page.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  const showForm = !saved || editing;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{saved && !editing ? 'Your review' : 'Rate your order'}</Text>
      {showForm && <Text style={styles.sub}>How was the food? Your review helps other customers.</Text>}

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            disabled={!showForm}
            onPress={() => setRating(n)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Feather name="star" size={ms(26)} color={n <= rating ? foodColors.primary : foodColors.border} />
          </TouchableOpacity>
        ))}
      </View>

      {showForm ? (
        <>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Tell others what you liked (optional)"
            placeholderTextColor={foodColors.textMuted}
            multiline
            maxLength={500}
          />
          <View style={styles.row}>
            {saved && (
              <TouchableOpacity style={styles.secondary} onPress={() => { setEditing(false); setRating(saved.rating); setComment(saved.comment ?? ''); }}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.primary, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy} activeOpacity={0.85}>
              {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryText}>{saved ? 'Update review' : 'Send review'}</Text>}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {saved?.comment ? <Text style={styles.comment}>“{saved.comment}”</Text> : null}
          {saved?.reply ? (
            <View style={styles.replyBox}>
              <Text style={styles.replyLabel}>Restaurant replied</Text>
              <Text style={styles.replyText}>{saved.reply}</Text>
            </View>
          ) : null}
          <TouchableOpacity onPress={() => { setEditing(true); setMessage(null); }} style={styles.editLink}>
            <Feather name="edit-2" size={ms(12)} color={foodColors.primary} />
            <Text style={styles.editText}>Edit review</Text>
          </TouchableOpacity>
        </>
      )}

      {message && <Text style={[styles.message, { color: message.ok ? foodColors.success : foodColors.error }]}>{message.text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: foodColors.surface, borderRadius: ms(16), padding: ms(16), borderWidth: 1, borderColor: foodColors.border, marginBottom: ms(16) },
  title: { fontSize: ms(15), fontFamily: fonts.poppins.bold, color: foodColors.textPrimary },
  sub: { fontSize: ms(12), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginTop: ms(2) },
  stars: { flexDirection: 'row', gap: ms(10), marginTop: ms(12), marginBottom: ms(4) },
  input: {
    minHeight: ms(72), borderWidth: 1, borderColor: foodColors.border, borderRadius: ms(12), padding: ms(12), marginTop: ms(10),
    fontSize: ms(13), fontFamily: fonts.poppins.regular, color: foodColors.textPrimary, textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: ms(10), marginTop: ms(12) },
  primary: { backgroundColor: foodColors.primary, borderRadius: ms(12), paddingVertical: ms(11), paddingHorizontal: ms(18), minWidth: ms(120), alignItems: 'center' },
  primaryText: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: '#fff' },
  secondary: { borderRadius: ms(12), paddingVertical: ms(11), paddingHorizontal: ms(14), borderWidth: 1, borderColor: foodColors.border },
  secondaryText: { fontSize: ms(13), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  comment: { fontSize: ms(13), lineHeight: ms(19), fontFamily: fonts.poppins.regular, color: foodColors.textPrimary, marginTop: ms(8) },
  replyBox: { backgroundColor: foodColors.background, borderRadius: ms(12), padding: ms(10), marginTop: ms(10) },
  replyLabel: { fontSize: ms(11), fontFamily: fonts.poppins.semiBold, color: foodColors.textSecondary },
  replyText: { fontSize: ms(12.5), lineHeight: ms(18), fontFamily: fonts.poppins.regular, color: foodColors.textPrimary, marginTop: ms(2) },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: ms(6), marginTop: ms(12), alignSelf: 'flex-start' },
  editText: { fontSize: ms(12), fontFamily: fonts.poppins.semiBold, color: foodColors.primary },
  message: { fontSize: ms(12), fontFamily: fonts.poppins.regular, marginTop: ms(10) },
});
