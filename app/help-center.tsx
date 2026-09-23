import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

type Faq = { id: string; question: string; answer: string };

const faqs: Faq[] = [
  { id: 'f1', question: 'How do I track my E-Chop order?', answer: 'Open My Orders from your profile, select the order, and you\'ll see live status updates from preparation to delivery.' },
  { id: 'f2', question: 'How long does E-Wash pickup take?', answer: 'Pickups are usually scheduled within 2–4 hours of booking, depending on your location and rider availability.' },
  { id: 'f3', question: 'Can I change my delivery address after ordering?', answer: 'Yes, as long as the order hasn\'t been picked up yet. Contact support or use Live Chat to update it quickly.' },
  { id: 'f4', question: 'How do referral rewards work?', answer: 'Share your code from Refer & Earn. Once your friend completes their first order, you both get ₦1,000 credit.' },
  { id: 'f5', question: 'What payment methods are supported?', answer: 'We support debit cards (Visa, Mastercard, Verve) and bank transfer. Add or manage cards under Payment Methods.' },
  { id: 'f6', question: 'How do I cancel an order?', answer: 'Go to My Orders, open the order, and tap Cancel Order. This is only available before the order is picked up.' },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return faqs;
    const q = query.toLowerCase();
    return faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Help Center" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={foodColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor={foodColors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
        <View style={styles.group}>
          {filtered.map((faq, index) => {
            const isOpen = expandedId === faq.id;
            return (
              <TouchableOpacity
                key={faq.id}
                style={[styles.faqRow, index === filtered.length - 1 && styles.faqRowLast]}
                onPress={() => setExpandedId(isOpen ? null : faq.id)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Feather
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={foodColors.textMuted}
                  />
                </View>
                {isOpen && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
              </TouchableOpacity>
            );
          })}
          {filtered.length === 0 && (
            <Text style={styles.emptyText}>No results for "{query}".</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => router.push('/contact-support')}
          activeOpacity={0.8}
        >
          <View style={styles.contactIconWrap}>
            <Feather name="headphones" size={18} color={foodColors.primary} />
          </View>
          <View style={styles.contactTextBlock}>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactSubtitle}>
              Reach out to our support team directly
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={foodColors.textMuted} />
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    padding: 0,
    minWidth: 0,
  },

  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: 10,
  },
  group: {
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  faqRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  faqRowLast: { borderBottomWidth: 0 },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  faqAnswer: {
    fontSize: 12.5,
    fontFamily: fonts.poppins.regular,
    lineHeight: 18,
    color: foodColors.textSecondary,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: foodColors.surface,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTextBlock: { flex: 1, minWidth: 0 },
  contactTitle: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  contactSubtitle: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
  },

  bottomSpacer: { height: 20 },
});