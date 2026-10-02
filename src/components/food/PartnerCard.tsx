import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { foodColors } from '../../constants/foodColors';
import { Partner } from '../../constants/foodData';
import { fonts } from '../../constants/typography';

export function PartnerCard({ partner, onPress }: { partner: Partner; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: partner.image }} style={styles.image} />
        <View style={styles.logo}>
          <Image source={partner.logo} style={styles.logoImage} resizeMode="cover" />
        </View>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.name}>{partner.name}</Text>
        <View style={styles.metaRow}>
          <Feather name="star" size={10} color={foodColors.primary} />
          <Text style={styles.meta}>{partner.rating} • {partner.etaMinutes} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    padding: 5,
    borderRadius: 16,
    backgroundColor: foodColors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  imageWrap: { width: '100%', height: 70 },
  image: { width: '100%', height: '100%', borderRadius: 12 },
  logo: {
    position: 'absolute',
    bottom: -11,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: foodColors.surface,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  logoImage: { width: '100%', height: '100%' },
  textBlock: { paddingHorizontal: 6, paddingBottom: 4 },
  name: { fontSize: 12.5, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary, marginTop: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  meta: { fontSize: 10.5, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
});