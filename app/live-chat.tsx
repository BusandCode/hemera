import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { ScreenHeader } from '../src/components/profile/ScreenHeader';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { useProfile } from '../src/context/ProfileContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from '../src/utils/responsive';

const BUCKET = 'support-attachments';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_LENGTH = 2000;

// A message as stored in the support_messages table.
type Row = {
  id: string;
  sender: 'user' | 'agent';
  body: string | null;
  image_path: string | null;
  agent_name: string | null;
  created_at: string;
};

// What the list shows. The welcome bubble is local and is never saved.
type Item = Row & { local?: boolean };

function formatTime(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === new Date().toDateString()) return time;
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time}`;
}

function friendlyError(e: any): string {
  const message = String(e?.message ?? '');
  if (message.includes('rate_limited')) return "You're sending messages too quickly. Please wait a moment and try again.";
  if (message.includes('too large')) return message;
  return 'Please check your connection and try again.';
}

export default function LiveChatScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile } = useProfile();
  const userId = session?.user.id;
  const firstName = profile.fullName?.trim().split(/\s+/)[0] ?? '';

  const listRef = useRef<FlatList<Item>>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollToLatest = () => {
    listRef.current?.scrollToEnd({ animated: true });
  };

  // Keep the newest message in view when the keyboard opens.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardOpen(true);
      setTimeout(scrollToLatest, 100);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Load the conversation every time the screen is opened, so nothing missed while away is lost.
  const load = useCallback(async () => {
    if (!userId) return;
    setLoadError(false);
    const { data, error } = await supabase
      .from('support_messages')
      .select('id, sender, body, image_path, agent_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(300);

    if (error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // New messages (including replies from support) arrive while the chat is open.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`support-chat-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `user_id=eq.${userId}` },
        (payload: any) => {
          const row = payload.new as Row;
          setRows((prev) => (prev.some((r) => r.id === row.id) ? prev : [...prev, row]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Photos are private, so each one is shown through a temporary link.
  useEffect(() => {
    const missing = rows
      .map((r) => r.image_path)
      .filter((p): p is string => !!p && !imageUrls[p]);
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrls(missing, 6 * 3600);
      if (cancelled || !data) return;
      setImageUrls((prev) => {
        const next = { ...prev };
        for (const item of data) {
          if (item.path && item.signedUrl) next[item.path] = item.signedUrl;
        }
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [rows]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPendingImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const rawExt = (uri.split('?')[0].split('.').pop() ?? 'jpg').toLowerCase();
    const ext = rawExt === 'png' || rawExt === 'webp' ? rawExt : 'jpg';
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const response = await fetch(uri);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      throw new Error('That photo is too large. Please choose one under 5 MB.');
    }

    // The first part of the path is the customer's id. The storage rules rely on it.
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: false });
    if (error) throw error;
    return path;
  };

  const send = async () => {
    if (sending || !userId) return;
    const text = draft.trim();
    if (!text && !pendingImage) return;

    setSending(true);
    try {
      const imagePath = pendingImage ? await uploadImage(pendingImage) : null;

      const { data, error } = await supabase
        .from('support_messages')
        .insert({ user_id: userId, sender: 'user', body: text || null, image_path: imagePath })
        .select('id, sender, body, image_path, agent_name, created_at')
        .single();
      if (error) throw error;

      const row = data as Row;
      setRows((prev) => (prev.some((r) => r.id === row.id) ? prev : [...prev, row]));
      setDraft('');
      setPendingImage(null);
    } catch (e: any) {
      // The draft stays in the box so nothing the person typed is lost.
      Alert.alert('Message not sent', friendlyError(e));
    } finally {
      setSending(false);
    }
  };

  const items: Item[] = [
    {
      id: 'welcome',
      local: true,
      sender: 'agent',
      body: `Hi${firstName ? ` ${firstName}` : ''} 👋 Welcome to Hemera support. Send us a message and we'll reply here as soon as we can.`,
      image_path: null,
      agent_name: null,
      created_at: '',
    },
    ...rows,
  ];

  const canSend = !sending && (draft.trim().length > 0 || !!pendingImage);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      // iOS: lift the screen by the keyboard height.
      // Android: handled natively by "softwareKeyboardLayoutMode": "pan" in app.json, so adding a behavior
      // here as well would move the input twice.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScreenHeader title="Live Chat" />

      <View style={styles.agentBar}>
        <View style={styles.agentAvatar}>
          <Text style={styles.agentAvatarText}>H</Text>
        </View>
        <View>
          <Text style={styles.agentName}>Hemera Support</Text>
          <Text style={styles.agentSubtitle}>We usually reply within a few hours</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={foodColors.primary} />
        </View>
      ) : loadError ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>We couldn't load your messages.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.8}
            onPress={() => {
              setLoading(true);
              load();
            }}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToLatest}
          onLayout={scrollToLatest}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const imageUrl = item.image_path ? imageUrls[item.image_path] : undefined;
            return (
              <View
                style={[
                  styles.bubbleRow,
                  item.sender === 'user' ? styles.bubbleRowUser : styles.bubbleRowAgent,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    item.sender === 'user' ? styles.bubbleUser : styles.bubbleAgent,
                    !!item.image_path && styles.bubbleWithImage,
                  ]}
                >
                  {!!item.image_path &&
                    (imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={[styles.messageImage, !!item.body && styles.messageImageSpaced]}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.messageImage, styles.imagePlaceholder]}>
                        <ActivityIndicator color={foodColors.textMuted} />
                      </View>
                    ))}
                  {!!item.body && (
                    <Text
                      style={[
                        styles.bubbleText,
                        item.sender === 'user' && styles.bubbleTextUser,
                        !!item.image_path && styles.bubbleTextWithImage,
                      ]}
                    >
                      {item.body}
                    </Text>
                  )}
                </View>
                {!item.local && (
                  <Text style={styles.timeText}>
                    {item.sender === 'agent' && item.agent_name ? `${item.agent_name} · ` : ''}
                    {formatTime(item.created_at)}
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}

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

        <View
          style={[
            styles.inputBar,
            { paddingBottom: (keyboardOpen ? 0 : insets.bottom) + ms(14) },
          ]}
        >
          <TouchableOpacity
            style={styles.attachButton}
            onPress={pickImage}
            activeOpacity={0.8}
            disabled={sending}
          >
            <Feather name="image" size={ms(18)} color={foodColors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={foodColors.textMuted}
            value={draft}
            onChangeText={setDraft}
            maxLength={MAX_TEXT_LENGTH}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={send}
            activeOpacity={0.8}
            disabled={!canSend}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={ms(16)} color="#fff" />
            )}
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
  agentSubtitle: {
    fontSize: ms(11),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    marginTop: ms(2),
  },

  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: ms(12) },
  stateText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
  },
  retryButton: {
    paddingHorizontal: ms(18),
    paddingVertical: ms(9),
    borderRadius: ms(18),
    backgroundColor: foodColors.primary,
  },
  retryText: { fontSize: ms(13), fontFamily: fonts.poppins.bold, color: '#fff' },

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
  imagePlaceholder: {
    backgroundColor: foodColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  sendButtonDisabled: { opacity: 0.5 },
});