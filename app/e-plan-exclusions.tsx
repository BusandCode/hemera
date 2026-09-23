import { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EPlanHeader } from '../src/components/eplan/EPlanHeader';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { useProfile } from '../src/context/ProfileContext';

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
const ACCENT_BLUE = '#1E3FEA';
const NOTE_MAX_LENGTH = 250;

// TODO: wire this up to a real wallet balance once a WalletContext exists —
// there's no wallet source in AppDataContext/AuthContext yet.
const WALLET_BALANCE = 45000;

type Option = { key: string; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap };

// A couple of these (shellfish, onions, kosher) don't have an exact icon in this
// installed MaterialCommunityIcons version — using a safe generic stand-in.
// Swap for real icon assets if you have them.
const PROTEINS: Option[] = [
  { key: 'pork', label: 'Pork', icon: 'pig-variant-outline' },
  { key: 'beef', label: 'Beef', icon: 'cow' },
  { key: 'chicken', label: 'Chicken', icon: 'food-drumstick-outline' },
  { key: 'fish', label: 'Fish', icon: 'fish' },
  { key: 'shellfish', label: 'Shellfish', icon: 'food-outline' },
  { key: 'lamb', label: 'Lamb / Goat', icon: 'sheep' },
  { key: 'offal', label: 'Offal', icon: 'food-variant' },
  { key: 'vegan', label: 'No Meat (Veg)', icon: 'leaf' },
];

const ALLERGENS: Option[] = [
  { key: 'peanuts', label: 'Peanuts', icon: 'peanut-outline' },
  { key: 'gluten', label: 'Gluten', icon: 'barley' },
  { key: 'dairy', label: 'Dairy', icon: 'bottle-tonic-outline' },
  { key: 'onions', label: 'Onions', icon: 'circle-outline' },
  { key: 'spicy', label: 'Very Spicy', icon: 'chili-mild' },
  { key: 'alcohol', label: 'Alcohol-based', icon: 'bottle-wine-outline' },
  { key: 'halal', label: 'Halal Only', icon: 'moon-waning-crescent' },
  { key: 'kosher', label: 'Kosher Only', icon: 'star-outline' },
];

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function toggle(list: string[], key: string) {
  return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
}

function OptionGrid({
  options,
  selected,
  onToggle,
  columns = 2,
}: {
  options: Option[];
  selected: string[];
  onToggle: (key: string) => void;
  columns?: 2 | 4;
}) {
  const compact = columns === 4;
  return (
    <View style={styles.grid}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt.key);
        return (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.card,
              { width: compact ? '22%' : '47%' },
              compact && styles.cardCompact,
              isSelected && styles.cardSelected,
            ]}
            activeOpacity={0.85}
            onPress={() => onToggle(opt.key)}
          >
            <View
              style={[
                styles.checkCircle,
                compact && styles.checkCircleCompact,
                isSelected && styles.checkCircleSelected,
              ]}
            >
              {isSelected && <Feather name="check" size={compact ? 9 : 10} color="#fff" />}
            </View>
            <MaterialCommunityIcons
              name={opt.icon}
              size={compact ? 20 : 22}
              color={isSelected ? ACCENT_BLUE : foodColors.textSecondary}
            />
            <Text
              style={[styles.cardLabel, compact && styles.cardLabelCompact, isSelected && styles.cardLabelSelected]}
              numberOfLines={compact ? 2 : 1}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function EPlanExclusionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  const [proteins, setProteins] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [note, setNote] = useState('');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <EPlanHeader
          wallet={formatNaira(WALLET_BALANCE)}
          initials={getInitials(profile.fullName)}
          onPressWallet={() => router.push('/wallet' as any)}
          onPressAvatar={() => router.push('/profile' as any)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Feather name="arrow-left" size={18} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Setup E-Plan</Text>
        </View>

        <Text style={styles.subtitle}>Step 2 of 3 — Dietary Restrictions</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '67%' }]} />
        </View>
        <Text style={styles.progressLabel}>67%</Text>

        <Text style={styles.sectionLabel}>PROTEINS TO EXCLUDE</Text>
        <OptionGrid
          options={PROTEINS}
          selected={proteins}
          onToggle={(k) => setProteins((p) => toggle(p, k))}
          columns={4}
        />

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>ALLERGENS & PREFERENCES</Text>
        <OptionGrid
          options={ALLERGENS}
          selected={allergens}
          onToggle={(k) => setAllergens((a) => toggle(a, k))}
          columns={4}
        />

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>ADDITIONAL NOTE (OPTIONAL)</Text>
        <View style={styles.noteBox}>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={(text) => setNote(text.slice(0, NOTE_MAX_LENGTH))}
            placeholder="Tell us anything else about your allergies, preferences or dietary needs..."
            placeholderTextColor={foodColors.textMuted}
            multiline
            maxLength={NOTE_MAX_LENGTH}
          />
          <Text style={styles.noteCount}>
            {note.length}/{NOTE_MAX_LENGTH}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.reviewBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/e-plan-review' as any)}
        >
          <Text style={styles.reviewBtnText}>Review & Pay</Text>
          <Feather name="arrow-right" size={16} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: { paddingHorizontal: 26, paddingBottom: 8 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 26 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: { fontSize: 27, fontFamily: serif, fontWeight: '700', color: foodColors.textPrimary },
  subtitle: { fontSize: 13, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, marginBottom: 18 },

  progressTrack: { height: 4, borderRadius: 2, backgroundColor: foodColors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: foodColors.primary, borderRadius: 2 },
  progressLabel: {
    alignSelf: 'center',
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    marginTop: 6,
    marginBottom: 24,
  },

  sectionLabel: { fontSize: 11, fontFamily: fonts.poppins.bold, color: foodColors.textMuted, letterSpacing: 0.6, marginBottom: 10 },
  sectionSpacing: { marginTop: 26 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: foodColors.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  cardCompact: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 6,
  },
  cardSelected: { backgroundColor: 'rgba(30,63,234,0.08)', borderColor: ACCENT_BLUE },
  checkCircle: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: foodColors.border,
    backgroundColor: foodColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleCompact: { top: 6, right: 6, width: 15, height: 15, borderRadius: 7.5 },
  checkCircleSelected: { backgroundColor: ACCENT_BLUE, borderColor: ACCENT_BLUE },
  cardLabel: { fontSize: 12.5, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  cardLabelCompact: { fontSize: 10.5, textAlign: 'center', lineHeight: 13 },
  cardLabelSelected: { color: foodColors.textPrimary },

  noteBox: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: foodColors.border,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  noteInput: {
    minHeight: 70,
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    textAlignVertical: 'top',
    padding: 0,
  },
  noteCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    marginTop: 4,
  },

  reviewBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#161311',
    borderRadius: 26,
    paddingVertical: 16,
    marginTop: 30,
  },
  reviewBtnText: { fontSize: 15, fontFamily: fonts.poppins.bold, color: '#fff' },
});