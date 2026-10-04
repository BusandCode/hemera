import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../src/utils/responsive';

type Message = {
  id: string;
  from: 'user' | 'agent';
  text: string;
  imageUri?: string;
  time: string;
};

const initialMessages: Message[] = [
  { id: 'm1', from: 'agent', text: "Hi Suleiman 👋 I'm Ada from hemera support. How can I help you today?", time: '10:02 AM' },
  { id: 'm2', from: 'user', text: 'Hey, my laundry order #239604 still shows "Scheduled" — is that normal?', time: '10:04 AM' },
  { id: 'm3', from: 'agent', text: "Yes, that's expected until the rider picks it up. Pickup is set for 2:00 PM today.", time: '10:05 AM' },
];

export default function LiveChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPendingImage(result.assets[0].uri);
    }
  };

  const send = () => {
    const trimmed = draft.trim();
    if (!trimmed && !pendingImage) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        from: 'user',
        text: trimmed,
        imageUri: pendingImage ?? undefined,
        time: 'Now',
      },
    ]);
    setDraft('');
    setPendingImage(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <StatusBar style="dark" />
      <ScreenHeader title="Live Chat" />

      <View style={styles.agentBar}>
        <View style={styles.agentAvatar}>
          <Text style={styles.agentAvatarText}>A</Text>
        </View>
        <View>
          <Text style={styles.agentName}>Ada · Support Agent</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubbleRow,
              item.from === 'user' ? styles.bubbleRowUser : styles.bubbleRowAgent,
            ]}
          >
            <View
              style={[
                styles.bubble,
                item.from === 'user' ? styles.bubbleUser : styles.bubbleAgent,
                item.imageUri && styles.bubbleWithImage,
              ]}
            >
              {item.imageUri && (
                <Image
                  source={{ uri: item.imageUri }}
                  style={[styles.messageImage, !!item.text && styles.messageImageSpaced]}
                  resizeMode="cover"
                />
              )}
              {!!item.text && (
                <Text
                  style={[
                    styles.bubbleText,
                    item.from === 'user' && styles.bubbleTextUser,
                    item.imageUri && styles.bubbleTextWithImage,
                  ]}
                >
                  {item.text}
                </Text>
              )}
            </View>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        {pendingImage && (
          <View style={styles.previewRow}>
            <View>
              <Image source={{ uri: pendingImage }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.previewRemove}
                onPress={() => setPendingImage(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={ms(12)} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + ms(14) }]}>
          <TouchableOpacity style={styles.attachButton} onPress={pickImage} activeOpacity={0.8}>
            <Feather name="image" size={ms(18)} color={foodColors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={foodColors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={send} activeOpacity={0.8}>
            <Feather name="send" size={ms(16)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },

  agentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    paddingHorizontal: '5.5%',
    paddingBottom: ms(14),
  },
  agentAvatar: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: foodColors.badgeBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentAvatarText: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  agentName: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: ms(5), marginTop: ms(2) },
  onlineDot: { width: 6, height: 6, borderRadius: ms(3), backgroundColor: foodColors.success },
  onlineText: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },

  list: { paddingHorizontal: '5.5%', paddingBottom: ms(12), gap: ms(14) },

  bubbleRow: { maxWidth: '82%' },
  bubbleRowUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowAgent: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: ms(16), paddingHorizontal: ms(14), paddingVertical: ms(10) },
  bubbleWithImage: { padding: ms(4) },
  bubbleAgent: { backgroundColor: foodColors.surface, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: foodColors.primary, borderBottomRightRadius: 4 },
  bubbleText: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(19),
    color: foodColors.textPrimary,
  },
  bubbleTextUser: { color: '#fff' },
  bubbleTextWithImage: { paddingHorizontal: ms(10), paddingBottom: ms(6) },
  messageImage: { width: ms(220), height: ms(220), borderRadius: ms(12) },
  messageImageSpaced: { marginBottom: ms(8) },
  timeText: {
    fontSize: ms(10),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    marginTop: ms(4),
  },

  footer: {
    backgroundColor: foodColors.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  previewRow: {
    flexDirection: 'row',
    paddingHorizontal: '5.5%',
    paddingTop: ms(12),
  },
  previewImage: { width: ms(64), height: ms(64), borderRadius: ms(12) },
  previewRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: foodColors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: ms(10),
    paddingHorizontal: '5.5%',
    paddingTop: ms(10),
  },
  attachButton: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: foodColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: foodColors.background,
    borderRadius: ms(18),
    paddingHorizontal: ms(14),
    paddingVertical: ms(10),
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },
  sendButton: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: foodColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});