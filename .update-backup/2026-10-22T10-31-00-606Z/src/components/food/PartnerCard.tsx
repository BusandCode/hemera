import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { Partner } from '../../constants/foodData';
import { fonts } from '../../constants/typography';
import { ms, clamp, MAX_FONT_SCALE } from '../../utils/responsive';

export function PartnerCard({
  partner,
  onPress,
  width = 172,
}: {
  partner: Partner;
  onPress?: () => void;
  width?: number;
}) {
  // Image height follows the card width so it keeps its shape on every screen.
  const imageHeight = clamp(Math.round(width * 0.45), 64, 120);

  return (
    <TouchableOpacity style={[styles.card, { width }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.imageWrap, { height: imageHeight }]}>
        <Image source={{ uri: partner.image }} style={styles.image} />
        <View style={styles.logo}>
          <Image source={partner.logo} style={styles.logoImage} resizeMode="cover" />
        </View>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {partner.name}
        </Text>
        <View style={styles.metaRow}>
          <Feather name="star" size={ms(10)} color={foodColors.primary} />
          <Text style={styles.meta} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {partner.rating} • {partner.etaMinutes} min
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 5,
    borderRadius: ms(16),
    backgroundColor: foodColors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  imageWrap: { width: '100%' },
  image: { width: '100%', height: '100%', borderRadius: ms(12) },
  logo: {
    position: 'absolute',
    bottom: -ms(11),
    left: 8,
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    borderWidth: 2,
    borderColor: foodColors.surface,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  logoImage: { width: '100%', height: '100%' },
  textBlock: { paddingHorizontal: 6, paddingBottom: 4 },
  name: { fontSize: ms(12.5), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary, marginTop: ms(15) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  meta: { fontSize: ms(10.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary, flexShrink: 1 },
});