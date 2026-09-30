import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import {
  termsSections,
  TermsBlock,
  TERMS_INTRO,
  TERMS_CLOSING,
  TERMS_LAST_UPDATED,
} from '../src/constants/termsContent';

function Block({ block }: { block: TermsBlock }) {
  if (block.type === 'sub') {
    return <Text style={styles.subTitle}>{block.text}</Text>;
  }

  if (block.type === 'p') {
    return <Text style={styles.paragraph}>{block.text}</Text>;
  }

  return (
    <View style={styles.list}>
      {block.items.map((item, index) => (
        <View key={index} style={styles.listRow}>
          {block.type === 'numbered' ? (
            <Text style={styles.listNumber}>{index + 1}.</Text>
          ) : (
            <View style={styles.bullet} />
          )}
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Terms of Service" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <Text style={styles.brand}>HEMERA APP TERMS OF SERVICE</Text>
          <Text style={styles.updated}>Last Updated: {TERMS_LAST_UPDATED}</Text>
          <Text style={styles.paragraph}>{TERMS_INTRO}</Text>
        </View>

        {termsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.blocks.map((block, index) => (
                <Block key={index} block={block} />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.closingCard}>
          <Text style={styles.closingText}>{TERMS_CLOSING}</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20 },

  introCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  brand: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
    letterSpacing: 0.4,
  },
  updated: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  subTitle: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginTop: 6,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    lineHeight: 20,
    color: foodColors.textSecondary,
    marginBottom: 8,
  },

  list: { marginBottom: 8, gap: 5 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingRight: 8 },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: foodColors.primary,
    marginTop: 8,
  },
  listNumber: {
    fontSize: 13,
    fontFamily: fonts.poppins.semiBold,
    lineHeight: 20,
    color: foodColors.primary,
    minWidth: 16,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    lineHeight: 20,
    color: foodColors.textSecondary,
  },

  closingCard: {
    backgroundColor: foodColors.primaryLight,
    borderRadius: 14,
    padding: 16,
  },
  closingText: {
    fontSize: 13,
    fontFamily: fonts.poppins.semiBold,
    lineHeight: 20,
    color: foodColors.textPrimary,
  },
  bottomSpacer: { height: 20 },
});