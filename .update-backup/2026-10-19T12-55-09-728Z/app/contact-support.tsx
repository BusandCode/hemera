import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  Modal,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../src/utils/responsive';

const channels = [
  { id: 'call', icon: 'phone', label: 'Call Us', value: '+234 700 123 4567', action: () => Linking.openURL('tel:+2347001234567') },
  { id: 'whatsapp', icon: 'message-circle', label: 'WhatsApp', value: 'Chat with us', action: () => Linking.openURL('https://wa.me/2347001234567') },
  { id: 'email', icon: 'mail', label: 'Email', value: 'support@busandcode.com', action: () => Linking.openURL('mailto:support@busandcode.com') },
] as const;

export default function ContactSupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const popAnim = useRef(new Animated.Value(0)).current;

  const scrollToEnd = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardOpen(true);
      setTimeout(scrollToEnd, 100);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (successVisible) {
      popAnim.setValue(0);
      Animated.spring(popAnim, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }).start();
    }
  }, [successVisible, popAnim]);

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) return;
    setSubject('');
    setMessage('');
    Keyboard.dismiss();
    setSuccessVisible(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar style="dark" />
      <ScreenHeader title="Contact Support" />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.liveChatCard}
          onPress={() => router.push('/live-chat')}
          activeOpacity={0.85}
        >
          <View style={styles.liveChatIconWrap}>
            <Feather name="message-square" size={ms(18)} color="#fff" />
          </View>
          <View style={styles.liveChatTextBlock}>
            <Text style={styles.liveChatTitle}>Chat with us live</Text>
            <Text style={styles.liveChatSubtitle}>Typical reply time: under 2 minutes</Text>
          </View>
          <Feather name="arrow-right" size={ms(16)} color="#fff" />
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
                  size={ms(16)}
                  color={foodColors.primary}
                />
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.title}>{channel.label}</Text>
                <Text style={styles.subtitle}>{channel.value}</Text>
              </View>
              <Feather name="chevron-right" size={ms(16)} color={foodColors.textMuted} />
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
            onChangeText={setSubject}
          />
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Describe your issue..."
            placeholderTextColor={foodColors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: (keyboardOpen ? 0 : insets.bottom) + ms(14) },
        ]}
      >
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.85}>
          <Text style={styles.sendButtonText}>Send Message</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSuccessVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: popAnim,
                transform: [
                  {
                    scale: popAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalIconRing}>
              <View style={styles.modalIconCircle}>
                <Feather name="check" size={ms(28)} color="#fff" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Message Sent</Text>
            <Text style={styles.modalText}>
              Thanks for reaching out. Our support team will get back to you shortly.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setSuccessVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(16) },

  liveChatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: foodColors.primary,
    borderRadius: ms(16),
    padding: ms(14),
    marginBottom: ms(20),
  },
  liveChatIconWrap: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveChatTextBlock: { flex: 1, minWidth: 0 },
  liveChatTitle: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  liveChatSubtitle: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: ms(2),
  },

  sectionLabel: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: ms(10),
  },
  group: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    overflow: 'hidden',
    marginBottom: ms(20),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(13),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(10),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  subtitle: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
  },

  formGroup: { gap: ms(12), marginBottom: ms(4) },
  input: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    paddingHorizontal: ms(14),
    paddingVertical: Platform.OS === 'ios' ? ms(13) : ms(10),
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },
  messageInput: { minHeight: ms(100), textAlignVertical: 'top' },

  bottomSpacer: { height: ms(90) },

  footer: {
    backgroundColor: foodColors.surface,
    paddingHorizontal: '5.5%',
    paddingTop: ms(14),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  sendButton: {
    backgroundColor: foodColors.primary,
    paddingVertical: ms(15),
    borderRadius: ms(26),
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '8%',
  },
  modalCard: {
    width: '100%',
    backgroundColor: foodColors.surface,
    borderRadius: ms(24),
    paddingHorizontal: ms(24),
    paddingTop: ms(28),
    paddingBottom: ms(22),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalIconRing: {
    width: ms(88),
    height: ms(88),
    borderRadius: ms(44),
    backgroundColor: 'rgba(52,199,89,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(18),
  },
  modalIconCircle: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: foodColors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: ms(18),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginBottom: ms(8),
  },
  modalText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(20),
    color: foodColors.textSecondary,
    textAlign: 'center',
    marginBottom: ms(22),
  },
  modalButton: {
    width: '100%',
    backgroundColor: foodColors.primary,
    paddingVertical: ms(14),
    borderRadius: ms(26),
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
});