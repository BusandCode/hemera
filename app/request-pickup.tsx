import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { washColors } from '../src/constants/washColors';
import { fonts } from '../src/constants/typography';
import { useAppData } from '../src/context/AppDataContext';

type Gender = 'men' | 'women';

type LaundryItem = {
  id: string;
  gender: Gender;
  name: string;
  icon: { lib: 'feather'; name: keyof typeof Feather.glyphMap } | { lib: 'mci'; name: keyof typeof MaterialCommunityIcons.glyphMap };
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

const timeSlots = [
  { id: 'morning', label: 'Morning', hint: '8am – 12pm' },
  { id: 'afternoon', label: 'Afternoon', hint: '12pm – 4pm' },
  { id: 'evening', label: 'Evening', hint: '4pm – 8pm' },
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
    <View style={styles.itemRow}>
      <View style={styles.itemIconWrap}>
        <ItemIcon icon={item.icon} />
      </View>
      <View style={styles.itemTextBlock}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemHint}>Included in your plan</Text>
      </View>
      <View style={styles.stepper}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(item.id, Math.max(0, qty - 1))}>
          <Feather name="minus" size={14} color={washColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepValue}>{qty}</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(item.id, qty + 1)}>
          <Feather name="plus" size={14} color={washColors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RequestPickupScreen() {
  const router = useRouter();
  const { addresses } = useAppData();

  const [addressId, setAddressId] = useState(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ''
  );
  const [gender, setGender] = useState<Gender>('men');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showExtras, setShowExtras] = useState(false);
  const [slotId, setSlotId] = useState(timeSlots[0].id);
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

  const canSubmit = addressId.length > 0 && totalItems > 0 && agreed;

  const handleSubmit = () => {
    if (!canSubmit) return;
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={washColors.textPrimary} />
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
            <Feather name="tag" size={16} color={washColors.coveredText} />
          </View>
          <Text style={styles.planBannerText}>
            <Text style={styles.planBannerTextBold}>Covered by your plan — </Text>
            pickup, delivery and standard processing are included.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Where should we pick up?</Text>
        <Text style={styles.sectionSubtitle}>Choose the address for your laundry pickup.</Text>

        <View style={styles.itemsList}>
          {addresses.map((address) => {
            const isActive = address.id === addressId;
            return (
              <TouchableOpacity
                key={address.id}
                style={[styles.itemRow, isActive && styles.itemRowActive]}
                onPress={() => setAddressId(address.id)}
                activeOpacity={0.8}
              >
                <View style={styles.itemIconWrap}>
                  <Feather name={address.icon} size={16} color={washColors.navySolid} />
                </View>
                <View style={styles.itemTextBlock}>
                  <Text style={styles.itemName}>{address.label}</Text>
                  <Text style={styles.itemHint}>
                    {address.line}, {address.details}
                  </Text>
                </View>
                {isActive && <Feather name="check-circle" size={18} color={washColors.navySolid} />}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.itemRow} onPress={() => router.push('/add-address')} activeOpacity={0.8}>
            <View style={styles.itemIconWrap}>
              <Feather name="plus" size={16} color={washColors.navySolid} />
            </View>
            <Text style={styles.itemName}>Add New Address</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>What are we picking up?</Text>
        <Text style={styles.sectionSubtitle}>Tap to add items covered by your plan.</Text>

        <View style={styles.genderToggle}>
          <TouchableOpacity
            style={[styles.genderPill, gender === 'men' && styles.genderPillActive]}
            onPress={() => setGender('men')}
            activeOpacity={0.85}
          >
            <Feather name="user" size={14} color={gender === 'men' ? '#fff' : washColors.navySolid} />
            <Text style={[styles.genderText, gender === 'men' && styles.genderTextActive]}>Men's</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderPill, gender === 'women' && styles.genderPillActive]}
            onPress={() => setGender('women')}
            activeOpacity={0.85}
          >
            <Feather name="user" size={14} color={gender === 'women' ? '#fff' : washColors.navySolid} />
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
          <Feather name="plus-circle" size={16} color={washColors.navySolid} />
          <Text style={styles.expandText}>{showExtras ? 'Hide blankets, duvets & more' : 'Add more items'}</Text>
          <Feather name={showExtras ? 'chevron-up' : 'chevron-down'} size={16} color={washColors.navySolid} />
        </TouchableOpacity>

        {showExtras && (
          <View style={styles.itemsList}>
            {extraItems.map((item) => (
              <ItemRow key={item.id} item={item} qty={quantities[item.id] ?? 0} onChange={setQty} />
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Preferred pickup time</Text>
        <Text style={styles.sectionSubtitle}>Pick a window that works for you.</Text>

        <View style={styles.itemsList}>
          {timeSlots.map((item) => {
            const isActive = item.id === slotId;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemRow, isActive && styles.itemRowActive]}
                onPress={() => setSlotId(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.itemIconWrap}>
                  <Feather name="clock" size={16} color={washColors.navySolid} />
                </View>
                <View style={styles.itemTextBlock}>
                  <Text style={styles.itemName}>{item.label}</Text>
                  <Text style={styles.itemHint}>{item.hint}</Text>
                </View>
                {isActive && <Feather name="check-circle" size={18} color={washColors.navySolid} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.expressCard} onPress={() => setExpress((v) => !v)} activeOpacity={0.85}>
          <View style={styles.expressIconWrap}>
            <Feather name="zap" size={18} color={washColors.gold} />
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
            <Feather name="award" size={15} color={washColors.textPrimary} />
            <Text style={styles.termsTitle}>Terms & conditions</Text>
          </View>
          <Text style={styles.termsBullet}>• We inspect each item before processing. Irreparable stains or damage are reported back.</Text>
          <Text style={styles.termsBullet}>• Missed pickups may be rescheduled once at no extra cost.</Text>
          <Text style={styles.termsBullet}>• Delivery returns to the address on file unless updated.</Text>

          <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed((v) => !v)} activeOpacity={0.8}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Feather name="check" size={13} color="#fff" />}
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

      <View style={styles.footer}>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
  },
  backBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontSize: 22,
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 16 },

  planBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: washColors.coveredBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
  },
  planIconWrap: { marginTop: 2 },
  planBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: fonts.poppins.regular,
    lineHeight: 18,
    color: washColors.textSecondary,
  },
  planBannerTextBold: {
    fontFamily: fonts.poppins.bold,
    color: washColors.coveredText,
  },

  sectionTitle: {
    fontSize: 19,
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: 3,
    marginBottom: 16,
  },
  sectionSpacing: { marginTop: 26 },

  itemsList: { gap: 10, marginBottom: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: washColors.surface,
    borderRadius: 16,
    padding: 12,
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: washColors.coveredBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTextBlock: { flex: 1, minWidth: 0 },
  itemName: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.semiBold,
    color: washColors.textPrimary,
  },
  itemHint: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: 2,
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: washColors.background,
    borderRadius: 20,
    paddingHorizontal: 6,
    height: 34,
    width: 94,
  },
  stepBtn: { width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
  stepValue: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },

  genderToggle: {
    flexDirection: 'row',
    backgroundColor: washColors.coveredBg,
    borderRadius: 24,
    padding: 4,
    marginBottom: 16,
  },
  genderPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
  },
  genderPillActive: { backgroundColor: washColors.navySolid },
  genderText: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.bold,
    color: washColors.navySolid,
  },
  genderTextActive: { color: '#fff' },

  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: washColors.coveredBg,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  expandText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fonts.poppins.bold,
    color: washColors.navySolid,
  },

  expressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: washColors.surface,
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  expressIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: washColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expressTextBlock: { flex: 1, minWidth: 0 },
  expressTitle: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },
  expressSubtitle: {
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
    marginTop: 3,
    lineHeight: 15,
  },

  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: washColors.grayBorder,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: { backgroundColor: washColors.navySolid },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  toggleThumbActive: { alignSelf: 'flex-end' },

  termsBox: {
    backgroundColor: '#FBF3D9',
    borderRadius: 18,
    padding: 16,
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  termsTitle: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },
  termsBullet: {
    fontSize: 12,
    fontFamily: fonts.poppins.regular,
    lineHeight: 18,
    color: washColors.textSecondary,
    marginBottom: 6,
  },

  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
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
    fontSize: 12.5,
    fontFamily: fonts.poppins.semiBold,
    color: washColors.textPrimary,
  },

  notesInput: {
    backgroundColor: washColors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: washColors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  bottomSpacer: { height: 100 },

  footer: {
    backgroundColor: washColors.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.regular,
    color: washColors.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: washColors.textPrimary,
  },

  continueButton: {
    backgroundColor: washColors.navySolid,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  continueButtonDisabled: { backgroundColor: washColors.grayBorder },
  continueButtonText: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  continueButtonTextDisabled: { color: washColors.textMuted },
});