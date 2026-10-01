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
          <Image source={{ uri: partner.logo }} style={styles.logoImage} />
        </View>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.name}>{partner.name}</Text>
        <View style={styles.metaRow}>
          <Feather name="star" size={11} color={foodColors.primary} />
          <Text style={styles.meta}>{partner.rating} • {partner.etaMinutes} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 172,
    padding: 6,
    borderRadius: 18,
    backgroundColor: foodColors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  imageWrap: { width: '100%', height: 100 },
  image: { width: '100%', height: '100%', borderRadius: 14 },
  logo: {
    position: 'absolute',
    bottom: -14,
    left: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: foodColors.surface,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  logoImage: { width: '100%', height: '100%' },
  textBlock: { paddingHorizontal: 6, paddingBottom: 8 },
  name: { fontSize: 13.5, fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary, marginTop: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { fontSize: 11, fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
});