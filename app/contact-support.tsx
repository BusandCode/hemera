import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

const channels = [
  { id: 'call', icon: 'phone', label: 'Call Us', value: '+234 700 123 4567', action: () => Linking.openURL('tel:+2347001234567') },
  { id: 'whatsapp', icon: 'message-circle', label: 'WhatsApp', value: 'Chat with us', action: () => Linking.openURL('https://wa.me/2347001234567') },
  { id: 'email', icon: 'mail', label: 'Email', value: 'support@busandcode.com', action: () => Linking.openURL('mailto:support@busandcode.com') },
] as const;

export default function ContactSupportScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) return;
    setSent(true);
    setSubject('');
    setMessage('');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Contact Support" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.liveChatCard}
          onPress={() => router.push('/live-chat')}
          activeOpacity={0.85}
        >
          <View style={styles.liveChatIconWrap}>
            <Feather name="message-square" size={18} color="#fff" />
          </View>
          <View style={styles.liveChatTextBlock}>
            <Text style={styles.liveChatTitle}>Chat with us live</Text>
            <Text style={styles.liveChatSubtitle}>Typical reply time: under 2 minutes</Text>
          </View>
          <Feather name="arrow-right" size={16} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Other Ways to Reach Us</Text>
        <View style={styles.group}>
          {channels.map((channel, index) => (
            <TouchableOpacity
              key={channel.id}
              style={[styles.channelRow, index === channels.length - 1 && styles.rowLast]}
              onPress={channel.action}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <Feather
                  name={channel.icon as keyof typeof Feather.glyphMap}
                  size={16}
                  color={foodColors.primary}
                />
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.title}>{channel.label}</Text>
                <Text style={styles.subtitle}>{channel.value}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={foodColors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Send a Message</Text>
        <View style={styles.formGroup}>
          <TextInput
            style={styles.input}
            placeholder="Subject"
            placeholderTextColor={foodColors.textMuted}
            value={subject}
            onChangeText={(text) => {
              setSubject(text);
              setSent(false);
            }}
          />
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Describe your issue..."
            placeholderTextColor={foodColors.textMuted}
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              setSent(false);
            }}
            multiline
          />
        </View>

        {sent && (
          <View style={styles.sentBanner}>
            <Feather name="check-circle" size={14} color={foodColors.success} />
            <Text style={styles.sentBannerText}>
              Message sent — we'll get back to you shortly
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.85}>
          <Text style={styles.sendButtonText}>Send Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: 16 },

  liveChatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: foodColors.primary,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  liveChatIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveChatTextBlock: { flex: 1, minWidth: 0 },
  liveChatTitle: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  liveChatSubtitle: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
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
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: 2,
  },

  formGroup: { gap: 12, marginBottom: 4 },
  input: {
    backgroundColor: foodColors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },
  messageInput: { minHeight: 100, textAlignVertical: 'top' },

  sentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  sentBannerText: {
    fontSize: 12,
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.success,
    flexShrink: 1,
  },

  bottomSpacer: { height: 90 },

  footer: {
    backgroundColor: foodColors.surface,
    paddingHorizontal: '5.5%',
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  sendButton: {
    backgroundColor: foodColors.primary,
    paddingVertical: 15,
    borderRadius: 26,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});