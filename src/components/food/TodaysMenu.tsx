import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { foodColors } from '../../constants/foodColors';
import { todaysMenu } from '../../constants/foodData';
import { MenuItemCard } from './MenuItemCard';
import { fonts } from '../../constants/typography';

export function TodaysMenu() {
  return (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today's Menu</Text>
          <Text style={styles.subtitle}>Fresh, hot and ready to order</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All →</Text>
        </TouchableOpacity>
      </View>
      <View style={{ gap: 12 }}>
        {todaysMenu.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 27,
    lineHeight: 34,
    letterSpacing: -0.5,
    fontFamily: fonts.serif.medium,
    color: foodColors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 0,
  },
  seeAll: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
    marginTop: 8,
  },
});