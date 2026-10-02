import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { foodColors } from '../../constants/foodColors';
import { partners } from '../../constants/foodData';
import { PartnerCard } from './PartnerCard';

const SIDE_PADDING = 26; // matches partnersSection paddingHorizontal in the screen
const LEFT_PAD = 2;
const GAP = 10;
const PEEK = 0.05; // fraction of the third card visible

export function NearbyPartners() {
  const { width: screenWidth } = useWindowDimensions();

  // Two full cards + two gaps + 5% of the third card fill the visible list area
  const cardWidth = (screenWidth - SIDE_PADDING - LEFT_PAD - GAP * 2) / (2 + PEEK);

  return (
    <View>
      <Text style={styles.heading}>NEARBY PARTNERS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {partners.map((p) => <PartnerCard key={p.id} partner={p} width={cardWidth} />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 11, fontWeight: '700', color: foodColors.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  scroll: { marginRight: -SIDE_PADDING },
  row: { gap: GAP, paddingLeft: LEFT_PAD, paddingRight: SIDE_PADDING, paddingTop: 0, paddingBottom: 4 },
});