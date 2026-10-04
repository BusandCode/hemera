import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { usePartners } from '../../hooks/useFood';
import { PartnerCard } from './PartnerCard';
import { ms, MAX_FONT_SCALE } from '../../utils/responsive';

const GAP = 10;

/**
 * sidePadding must match the horizontal padding of the parent section, so the
 * row can bleed to the right edge of the screen and the next card "peeks" in.
 */
export function NearbyPartners({ sidePadding = 16 }: { sidePadding?: number }) {
  const router = useRouter();
  const { partners } = usePartners();
  const { width: screenWidth } = useWindowDimensions();

  // ~2 cards + a peek on phones, ~3 on small tablets, ~4 on large tablets.
  const visible = screenWidth >= 900 ? 4.2 : screenWidth >= 600 ? 3.2 : 2.1;
  const available = screenWidth - sidePadding; // left padding only; right side bleeds
  const cardWidth = (available - GAP * Math.floor(visible)) / visible;

  return (
    <View>
      <Text style={styles.heading} maxFontSizeMultiplier={MAX_FONT_SCALE}>NEARBY PARTNERS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginRight: -sidePadding }}
        contentContainerStyle={[styles.row, { paddingRight: sidePadding }]}
      >
        {partners.map((p) => (
          <PartnerCard
            key={p.id}
            partner={p}
            width={cardWidth}
            onPress={() =>
              router.push({ pathname: '/partner/[id]', params: { id: p.id } } as any)
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: ms(6),
  },
  row: { gap: GAP, paddingLeft: 2, paddingTop: 0, paddingBottom: 6 },
});