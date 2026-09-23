import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

const languages = ['English', 'Hausa', 'Yoruba', 'Igbo', 'Pidgin'];

export default function LanguageLocationScreen() {
  const [language, setLanguage] = useState('English');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Language & Location" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Current Location</Text>
        <View style={styles.locationCard}>
          <View style={styles.locationIconWrap}>
            <Feather name="map-pin" size={18} color={foodColors.primary} />
          </View>
          <View style={styles.locationTextBlock}>
            <Text style={styles.locationTitle}>Lokoja, Kogi State</Text>
            <Text style={styles.locationSubtitle}>
              Used for delivery estimates and nearby partners
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.changeLocationButton} activeOpacity={0.8}>
          <Feather name="navigation" size={14} color={foodColors.badgeBlue} />
          <Text style={styles.changeLocationText}>Change Location</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>App Language</Text>
        <View style={styles.group}>
          {languages.map((lang, index) => {
            const isActive = lang === language;
            return (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langRow,
                  index === languages.length - 1 && styles.langRowLast,
                ]}
                onPress={() => setLanguage(lang)}
                activeOpacity={0.7}
              >
                <Text style={styles.langText}>{lang}</Text>
                {isActive && (
                  <Feather name="check" size={16} color={foodColors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 30 },

  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.poppins.bold,
    letterSpacing: 0.5,
    color: foodColors.textMuted,
    marginBottom: 8,
    marginTop: 16,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTextBlock: { flex: 1, minWidth: 0 },
  locationTitle: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  locationSubtitle: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(46,90,172,0.08)',
    paddingVertical: 12,
    borderRadius: 14,
  },
  changeLocationText: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: foodColors.badgeBlue,
  },

  group: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  langRowLast: { borderBottomWidth: 0 },
  langText: {
    fontSize: 14,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },

  bottomSpacer: { height: 20 },
});