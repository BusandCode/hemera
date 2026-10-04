import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { usePlanStatus } from '../src/hooks/usePlanStatus';
import { PlanRequiredState } from '../src/components/wash/PlanRequiredState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../src/utils/responsive';

type Gender = 'men' | 'women';

type LaundryItem = {
  id: string;
  gender: Gender;
  name: string;
  icon:
    | { lib: 'feather'; name: keyof typeof Feather.glyphMap }
    | { lib: 'mci'; name: keyof typeof MaterialCommunityIcons.glyphMap };
};

const coreItems: LaundryItem[] = [
  { id: 'men-shirt', gender: 'men', name: "Men's Shirt", icon: { lib: 'mci', name: 'hanger' } },
  { id: 'men-trousers', gender: 'men', name: "Men's Trousers", icon: { lib: 'feather', name: 'user' } },
  { id: 'men-native', gender: 'men', name: "Men's Native", icon: { lib: 'mci', name: 'hanger' } },
  { id: 'men-tshirt', gender: 'men', name: "Men's T-shirt", icon: { lib: 'feather', name: 'layers' } },
  { id: 'women-dress', gender: 'women', name: "Women's Dress", icon: { lib: 'mci', name: 'hanger' } },
  { id: 'women-blouse', gender: 'women', name: "Women's Blouse", icon: { lib: 'mci', name: 'hanger' } },
  { id: 'women-trousers', gender: 'women', name: "Women's Trousers", icon: { lib: 'feather', name: 'user' } },
  { id: 'women-gown', gender: 'women', name: "Women's Gown", icon: { lib: 'mci', name: 'hanger' } },
];

const sharedItems: LaundryItem[] = [
  { id: 'suit', gender: 'men', name: "Men's Suit (per piece)", icon: { lib: 'feather', name: 'briefcase' } },
  { id: 'underwear', gender: 'men', name: 'Underwear', icon: { lib: 'feather', name: 'layers' } },
];

const extraItems: LaundryItem[] = [
  { id: 'blanket', gender: 'men', name: 'Blanket', icon: { lib: 'mci', name: 'bed-outline' } },
  { id: 'duvet', gender: 'men', name: 'Duvet', icon: { lib: 'mci', name: 'bed-king-outline' } },
  { id: 'curtains', gender: 'men', name: 'Curtains', icon: { lib: 'mci', name: 'blinds' } },
];

const EXPRESS_FEE = 1500;

function ItemIcon({ icon, size = 18 }: { icon: LaundryItem['icon']; size?: number }) {
  return icon.lib === 'feather' ? (
    <Feather name={icon.name} size={size} color={washColors.navySolid} />
  ) : (
    <MaterialCommunityIcons name={icon.name} size={size} color={washColors.navySolid} />
  );
}

function ItemRow({
  item,
  qty,
  onChange,
}: {
  item: LaundryItem;
  qty: number;
  onChange: (id: string, qty: number) => void;
}) {
  return (
    <View style={[styles.itemRow, qty > 0 && styles.itemRowActive]}>
      <View style={styles.itemIconWrap}>
        <ItemIcon icon={item.icon} />
      </View>
      <View style={styles.itemTextBlock}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemHint}>Included in your plan</Text>
      </View>
      <View style={styles.stepper}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(item.id, Math.max(0, qty - 1))}>
          <Feather name="minus" size={ms(14)} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepValue}>{qty}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(item.id, qty + 1)}>
          <Feather name="plus" size={ms(14)} color={washColors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RequestPickupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status: planStatus, planName, expiredOn, isLoading } = usePlanStatus();

  const [gender, setGender] = useState<Gender>('men');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showExtras, setShowExtras] = useState(false);
  const [express, setExpress] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [notes, setNotes] = useState('');

  const visibleCoreItems = coreItems.filter((i) => i.gender === gender);

  const setQty = (id: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [id]: qty }));
  };

  const totalItems = useMemo(() => {
    return [...coreItems, ...sharedItems, ...extraItems].reduce(
      (count, item) => count + (quantities[item.id] ?? 0),
      0
    );
  }, [quantities]);

  const canSubmit = totalItems > 0 && agreed;

  const handleSubmit = () => {
    if (!canSubmit) return;
    router.back();
  };

  // All hooks above this line — early returns below.
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={washColors.navySolid} />
      </View>
    );
  }

  if (planStatus !== 'active') {
    return (
      <PlanRequiredState
        status={planStatus}
        planName={planName ?? undefined}
        expiredOn={expiredOn ?? undefined}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + ms(10) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={ms(22)} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Pickup</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.planBanner}>
          <View style={styles.planIconWrap}>
            <Feather name="tag" size={ms(16)} color={washColors.coveredText} />
          </View>
          <Text style={styles.planBannerText}>
            <Text style={styles.planBannerTextBold}>Covered by your plan — </Text>
            pickup, delivery and standard processing are included.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>What are we picking up?</Text>
        <Text style={styles.sectionSubtitle}>Tap to add items covered by your plan.</Text>

        <View style={styles.genderToggle}>
          <TouchableOpacity
            style={[styles.genderPill, gender === 'men' && styles.genderPillActive]}
            onPress={() => setGender('men')}
            activeOpacity={0.85}
          >
            <Feather name="user" size={ms(14)} color={gender === 'men' ? '#fff' : washColors.navySolid} />
            <Text style={[styles.genderText, gender === 'men' && styles.genderTextActive]}>Men's</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderPill, gender === 'women' && styles.genderPillActive]}
            onPress={() => setGender('women')}
            activeOpacity={0.85}
          >
            <Feather name="user" size={ms(14)} color={gender === 'women' ? '#fff' : washColors.navySolid} />
            <Text style={[styles.genderText, gender === 'women' && styles.genderTextActive]}>Women's</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemsList}>
          {visibleCoreItems.map((item) => (
            <ItemRow key={item.id} item={item} qty={quantities[item.id] ?? 0} onChange={setQty} />
          ))}
          {sharedItems.map((item) => (
            <ItemRow key={item.id} item={item} qty={quantities[item.id] ?? 0} onChange={setQty} />
          ))}
        </View>

        <TouchableOpacity style={styles.expandRow} onPress={() => setShowExtras((v) => !v)} activeOpacity={0.8}>
          <Feather name="plus-circle" size={ms(16)} color={washColors.navySolid} />
          <Text style={styles.expandText}>{showExtras ? 'Hide blankets, duvets & more' : 'Add more items'}</Text>
          <Feather name={showExtras ? 'chevron-up' : 'chevron-down'} size={ms(16)} color={washColors.navySolid} />
        </TouchableOpacity>

        {showExtras && (
          <View style={styles.itemsList}>
            {extraItems.map((item) => (
              <ItemRow key={item.id} item={item} qty={quantities[item.id] ?? 0} onChange={setQty} />
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.expressCard} onPress={() => setExpress((v) => !v)} activeOpacity={0.85}>
          <View style={styles.expressIconWrap}>
            <Feather name="zap" size={ms(18)} color="#fff" />
          </View>
          <View style={styles.expressTextBlock}>
            <Text style={styles.expressTitle}>Faster delivery (Express)</Text>
            <Text style={styles.expressSubtitle}>
              We pick up sooner and deliver back within 24 hrs · +₦{EXPRESS_FEE.toLocaleString('en-US')}
            </Text>
          </View>
          <View style={[styles.toggleTrack, express && styles.toggleTrackActive]}>
            <View style={[styles.toggleThumb, express && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>

        <View style={styles.termsBox}>
          <View style={styles.termsHeader}>
            <Feather name="award" size={ms(15)} color={washColors.textPrimary} />
            <Text style={styles.termsTitle}>Terms & conditions</Text>
          </View>
          <Text style={styles.termsBullet}>
            • We inspect each item before processing. Irreparable stains or damage are reported back.
          </Text>
          <Text style={styles.termsBullet}>• Missed pickups may be rescheduled once at no extra cost.</Text>
          <Text style={styles.termsBullet}>• Delivery returns to the address on file unless updated.</Text>

          <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed((v) => !v)} activeOpacity={0.8}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Feather name="check" size={ms(13)} color="#fff" />}
            </View>
            <Text style={styles.agreeText}>I agree to the pickup terms</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Pickup instructions</Text>
        <Text style={styles.sectionSubtitle}>Optional — anything that helps us find your bag.</Text>

        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Bag is by the front gate"
          placeholderTextColor={washColors.textMuted}
          multiline
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + ms(14) }]}>
        {totalItems > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {totalItems} item{totalItems > 1 ? 's' : ''} · covered by plan
            </Text>
            <Text style={styles.totalValue}>
              {express ? `+₦${EXPRESS_FEE.toLocaleString('en-US')}` : '₦0'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.continueButton, !canSubmit && styles.continueButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          <Text style={[styles.continueButtonText, !canSubmit && styles.continueButtonTextDisabled]}>
            Confirm Pickup
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: washColors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(16),
    paddingHorizontal: ms(20),
    paddingBottom: ms(16),
  },
  backBtn: { width: ms(28), height: ms(28), justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontSize: ms(22),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },

  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingBottom: ms(16) },

  planBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(10),
    backgroundColor: washColors.coveredBg,
    borderRadius: ms(16),
    padding: ms(14),
    marginBottom: ms(22),
  },
  planIconWrap: { marginTop: ms(2) },
  planBannerText: {
    flex: 1,
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(18),
    color: washColors.textSecondary,
  },
  planBannerTextBold: {
    fontFamily: fonts.poppins.bold,
    color: washColors.coveredText,
  },

  sectionTitle: {
    fontSize: ms(19),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: ms(3),
    marginBottom: ms(16),
  },
  sectionSpacing: { marginTop: ms(26) },

  itemsList: { gap: ms(10), marginBottom: ms(10) },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: washColors.surface,
    borderRadius: ms(16),
    padding: ms(12),
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  itemRowActive: { borderColor: washColors.navySolid },
  itemIconWrap: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(12),
    backgroundColor: washColors.coveredBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTextBlock: { flex: 1, minWidth: 0 },
  itemName: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.semiBold,
    color: washColors.textPrimary,
  },
  itemHint: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: ms(2),
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: washColors.background,
    borderRadius: ms(20),
    paddingHorizontal: ms(6),
    height: ms(34),
    width: ms(94),
  },
  stepBtn: { width: ms(22), height: ms(22), justifyContent: 'center', alignItems: 'center' },
  stepValue: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },

  genderToggle: {
    flexDirection: 'row',
    backgroundColor: washColors.coveredBg,
    borderRadius: ms(24),
    padding: ms(4),
    marginBottom: ms(16),
  },
  genderPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
    paddingVertical: ms(10),
    borderRadius: ms(20),
  },
  genderPillActive: { backgroundColor: washColors.navySolid },
  genderText: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.bold,
    color: washColors.navySolid,
  },
  genderTextActive: { color: '#fff' },

  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    backgroundColor: washColors.coveredBg,
    borderRadius: ms(16),
    paddingVertical: ms(13),
    paddingHorizontal: ms(14),
    marginBottom: ms(10),
  },
  expandText: {
    flex: 1,
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.bold,
    color: washColors.navySolid,
  },

  expressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: washColors.surface,
    borderRadius: ms(16),
    padding: ms(14),
    marginTop: ms(10),
    marginBottom: ms(18),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  expressIconWrap: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(12),
    backgroundColor: washColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expressTextBlock: { flex: 1, minWidth: 0 },
  expressTitle: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },
  expressSubtitle: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: ms(3),
    lineHeight: ms(15),
  },

  toggleTrack: {
    width: ms(44),
    height: ms(26),
    borderRadius: ms(13),
    backgroundColor: washColors.grayBorder,
    padding: ms(2),
    justifyContent: 'center',
  },
  toggleTrackActive: { backgroundColor: washColors.navySolid },
  toggleThumb: {
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    backgroundColor: '#fff',
  },
  toggleThumbActive: { alignSelf: 'flex-end' },

  termsBox: {
    backgroundColor: '#FBF3D9',
    borderRadius: ms(18),
    padding: ms(16),
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    marginBottom: ms(10),
  },
  termsTitle: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },
  termsBullet: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(18),
    color: washColors.textSecondary,
    marginBottom: ms(6),
  },

  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginTop: ms(8),
  },
  checkbox: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(5),
    borderWidth: 1.5,
    borderColor: washColors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: washColors.navySolid,
    borderColor: washColors.navySolid,
  },
  agreeText: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.semiBold,
    color: washColors.textPrimary,
  },

  notesInput: {
    backgroundColor: washColors.surface,
    borderRadius: ms(16),
    paddingHorizontal: ms(14),
    paddingVertical: ms(12),
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: washColors.textPrimary,
    minHeight: ms(80),
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  bottomSpacer: { height: ms(100) },

  footer: {
    backgroundColor: washColors.surface,
    paddingHorizontal: ms(20),
    paddingTop: ms(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ms(10),
  },
  totalLabel: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
  },
  totalValue: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },

  continueButton: {
    backgroundColor: washColors.navySolid,
    paddingVertical: ms(16),
    borderRadius: ms(28),
    alignItems: 'center',
  },
  continueButtonDisabled: { backgroundColor: washColors.grayBorder },
  continueButtonText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  continueButtonTextDisabled: { color: washColors.textMuted },
});