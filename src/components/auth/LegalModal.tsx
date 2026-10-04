import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { ms } from '../../utils/responsive';
import { LegalBlock, LegalDoc } from '../../constants/legalContent';

type Props = {
  visible: boolean;
  doc: LegalDoc;
  requireRead?: boolean;
  alreadyRead?: boolean;
  onClose: () => void;
  onAgree?: () => void;
};

const END_THRESHOLD = 32;

function Block({ block }: { block: LegalBlock }) {
  if (block.type === 'sub') return <Text style={styles.subTitle}>{block.text}</Text>;
  if (block.type === 'p') return <Text style={styles.paragraph}>{block.text}</Text>;
  return (
    <View style={styles.list}>
      {block.items.map((item, index) => (
        <View key={index} style={styles.listRow}>
          <View style={styles.bullet} />
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function LegalModal({ visible, doc, requireRead = false, alreadyRead = false, onClose, onAgree }: Props) {
  const insets = useSafeAreaInsets();
  const [reachedEnd, setReachedEnd] = useState(false);
  const [progress, setProgress] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);

  useEffect(() => {
    if (visible) {
      setReachedEnd(!requireRead || alreadyRead);
      setProgress(alreadyRead ? 1 : 0);
    }
  }, [visible, requireRead, alreadyRead]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    if (scrollable > 0) {
      setProgress(Math.min(1, Math.max(0, contentOffset.y / scrollable)));
    }
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - END_THRESHOLD) {
      setReachedEnd(true);
    }
  };

  const handleContentSize = (_w: number, h: number) => {
    if (layoutHeight > 0 && h <= layoutHeight + END_THRESHOLD) setReachedEnd(true);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + ms(10) }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={ms(22)} color={foodColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{doc.title}</Text>
          <View style={styles.closeButton} />
        </View>

        {requireRead && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onLayout={(e) => setLayoutHeight(e.nativeEvent.layout.height)}
          onContentSizeChange={handleContentSize}
        >
          <View style={styles.introCard}>
            <Text style={styles.brand}>HEMERA — {doc.title.toUpperCase()}</Text>
            <Text style={styles.updated}>Last Updated: {doc.updated}</Text>
            {doc.intro.map((text, index) => (
              <Text key={index} style={styles.paragraph}>
                {text}
              </Text>
            ))}
          </View>

          {doc.sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionCard}>
                {section.blocks.map((block, index) => (
                  <Block key={index} block={block} />
                ))}
              </View>
            </View>
          ))}

          {doc.closing ? (
            <View style={styles.closingCard}>
              <Text style={styles.closingText}>{doc.closing}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}>
          {requireRead ? (
            <>
              {!reachedEnd && (
                <View style={styles.hintRow}>
                  <Feather name="arrow-down" size={ms(13)} color={foodColors.textSecondary} />
                  <Text style={styles.hintText}>Scroll to the end to continue</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.primaryButton, !reachedEnd && styles.primaryButtonDisabled]}
                onPress={onAgree}
                disabled={!reachedEnd}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>I Agree</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(20),
    paddingBottom: ms(14),
  },
  closeButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: {
    flex: 1,
    fontSize: ms(17),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
  },
  progressTrack: { height: 3, backgroundColor: foodColors.border },
  progressFill: { height: 3, backgroundColor: foodColors.primary },

  scroll: { flex: 1 },
  content: { paddingHorizontal: ms(20), paddingTop: ms(16), paddingBottom: 24 },

  introCard: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(16),
    padding: ms(16),
    marginBottom: ms(20),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  brand: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.bold,
    color: foodColors.primary,
    letterSpacing: 0.4,
  },
  updated: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textMuted,
    marginTop: ms(2),
    marginBottom: ms(10),
  },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: ms(11.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: ms(8),
  },
  sectionCard: {
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    padding: ms(16),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  subTitle: {
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    marginTop: ms(6),
    marginBottom: ms(6),
  },
  paragraph: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(20),
    color: foodColors.textSecondary,
    marginBottom: ms(8),
  },
  list: { marginBottom: ms(8), gap: 5 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: ms(10), paddingRight: 8 },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: ms(3),
    backgroundColor: foodColors.primary,
    marginTop: ms(8),
  },
  listText: {
    flex: 1,
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    lineHeight: ms(20),
    color: foodColors.textSecondary,
  },

  closingCard: {
    backgroundColor: foodColors.primaryLight,
    borderRadius: ms(14),
    padding: ms(16),
  },
  closingText: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.semiBold,
    lineHeight: ms(20),
    color: foodColors.textPrimary,
  },

  footer: {
    paddingHorizontal: ms(20),
    paddingTop: ms(12),
    backgroundColor: foodColors.background,
    borderTopWidth: 1,
    borderTopColor: foodColors.border,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
    marginBottom: ms(10),
  },
  hintText: {
    fontSize: ms(12),
    fontFamily: fonts.poppins.medium,
    color: foodColors.textSecondary,
  },
  primaryButton: {
    backgroundColor: foodColors.primary,
    paddingVertical: ms(15),
    borderRadius: ms(26),
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { fontSize: ms(14), fontFamily: fonts.poppins.bold, color: '#fff' },
});