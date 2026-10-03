import { View, Image, StyleSheet } from 'react-native';

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
    aspectRatio: promoWidth / promoHeight,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
});