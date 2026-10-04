import { View, Image, StyleSheet } from 'react-native';
import { ms } from '../../utils/responsive';

const promo = require('../../../assets/promo.png');
const { width: promoWidth, height: promoHeight } = Image.resolveAssetSource(promo);

export function PromoBanner() {
  return (
    <View style={styles.banner}>
      <Image source={promo} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    // Already responsive via aspectRatio; cap width so it doesn't become a
    // giant billboard on tablets.
    maxWidth: 640,
    alignSelf: 'center',
    aspectRatio: promoWidth / promoHeight,
    borderRadius: ms(16),
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
});