import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';

type Message = {
  id: string;
  from: 'user' | 'agent';
  text: string;
  time: string;
};

const initialMessages: Message[] = [
  { id: 'm1', from: 'agent', text: "Hi Suleiman 👋 I'm Ada from BusandCode support. How can I help you today?", time: '10:02 AM' },
  { id: 'm2', from: 'user', text: 'Hey, my laundry order #239604 still shows "Scheduled" — is that normal?', time: '10:04 AM' },
  { id: 'm3', from: 'agent', text: "Yes, that's expected until the rider picks it up. Pickup is set for 2:00 PM today.", time: '10:05 AM' },
];

export default function LiveChatScreen() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState('');

  const send = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: 'user', text: trimmed, time: 'Now' },
    ]);
    setDraft('');
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
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  item.from === 'user' && styles.bubbleTextUser,
                ]}
              >
                {item.text}
              </Text>
            </View>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        )}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={foodColors.textMuted}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={send} activeOpacity={0.8}>
          <Feather name="send" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },

  agentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: '5.5%',
    paddingBottom: 14,
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: foodColors.badgeBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentAvatarText: {
    fontSize: 14,
    fontFamily: fonts.poppins.bold,
    color: '#fff',
  },
  agentName: {
    fontSize: 13,
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: foodColors.success },
  onlineText: {
    fontSize: 11,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },

  list: { paddingHorizontal: '5.5%', paddingBottom: 12, gap: 14 },

  bubbleRow: { maxWidth: '82%' },
  bubbleRowUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowAgent: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAgent: { backgroundColor: foodColors.surface, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: foodColors.primary, borderBottomRightRadius: 4 },
  bubbleText: {
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    lineHeight: 19,
    color: foodColors.textPrimary,
  },
  bubbleTextUser: { color: '#fff' },
  timeText: {
    fontSize: 10,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    marginTop: 4,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: '5.5%',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 26 : 14,
    backgroundColor: foodColors.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: foodColors.background,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: foodColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});