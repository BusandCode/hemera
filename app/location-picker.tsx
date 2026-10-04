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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { foodColors } from '../src/constants/foodColors';
import { fonts } from '../src/constants/typography';
import { NIGERIAN_STATES_LGAS, getLGAsForState } from '../src/constants/nigerianStatesLGAs';
import { useLocation } from '../src/context/LocationContext';
import { ms } from '../src/utils/responsive';

type Step = 'state' | 'lga';

export default function LocationPickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { location, setLocation } = useLocation();

  const [step, setStep] = useState<Step>('state');
  const [selectedState, setSelectedState] = useState('');
  const [query, setQuery] = useState('');

  const states = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NIGERIAN_STATES_LGAS;
    return NIGERIAN_STATES_LGAS.filter((s) => s.state.toLowerCase().includes(q));
  }, [query]);

  const lgas = useMemo(() => {
    if (!selectedState) return [];
    const list = getLGAsForState(selectedState);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((l) => l.toLowerCase().includes(q));
  }, [selectedState, query]);

  const pickState = (state: string) => {
    setSelectedState(state);
    setQuery('');
    setStep('lga');
  };

  const pickLga = (lga: string) => {
    setLocation({ state: selectedState, lga });
    router.back();
  };

  const goBack = () => {
    if (step === 'lga') {
      setStep('state');
      setSelectedState('');
      setQuery('');
      return;
    }
    router.back();
  };

  const currentLabel =
    location.lga && location.state
      ? `${location.lga}, ${location.state}`
      : 'Not set';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={goBack}>
          <Feather name="arrow-left" size={ms(22)} color={foodColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'state' ? 'Choose State' : selectedState || 'Choose LGA'}
        </Text>
        <TouchableOpacity
          style={[styles.headerBtn, styles.headerBtnRight]}
          onPress={() => router.back()}
        >
          <Feather name="x" size={ms(20)} color={foodColors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.currentWrap}>
        <Text style={styles.currentLabel}>CURRENT LOCATION</Text>
        <View style={styles.currentChip}>
          <Feather name="map-pin" size={ms(13)} color={foodColors.primary} />
          <Text style={styles.currentText}>{currentLabel}</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={ms(16)} color={foodColors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={step === 'state' ? 'Search states...' : 'Search LGAs...'}
          placeholderTextColor={foodColors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Feather name="x-circle" size={ms(16)} color={foodColors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'state' &&
          states.map((s) => {
            const isActive = s.state === location.state;
            return (
              <TouchableOpacity
                key={s.state}
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => pickState(s.state)}
              >
                <View style={styles.rowIcon}>
                  <Feather name="map" size={ms(15)} color={foodColors.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{s.state}</Text>
                </View>
                {isActive && <Feather name="check" size={ms(16)} color={foodColors.primary} />}
              </TouchableOpacity>
            );
          })}

        {step === 'lga' &&
          lgas.map((lga) => {
            const isActive =
              lga === location.lga && selectedState === location.state;
            return (
              <TouchableOpacity
                key={lga}
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => pickLga(lga)}
              >
                <View style={styles.rowIcon}>
                  <Feather name="map-pin" size={ms(15)} color={foodColors.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{lga}</Text>
                </View>
                {isActive && <Feather name="check" size={ms(16)} color={foodColors.primary} />}
              </TouchableOpacity>
            );
          })}

        {step === 'state' && states.length === 0 && (
          <Text style={styles.empty}>No states match "{query}".</Text>
        )}
        {step === 'lga' && lgas.length === 0 && (
          <Text style={styles.empty}>No LGAs match "{query}".</Text>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: foodColors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '5.5%',
    paddingTop: Platform.OS === 'ios' ? ms(6) : ms(16),
    paddingBottom: ms(14),
  },
  headerBtn: {
    width: ms(40),
    height: ms(40),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerBtnRight: { alignItems: 'flex-end' },
  headerTitle: {
    flex: 1,
    fontSize: ms(17),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: ms(8),
  },

  currentWrap: { paddingHorizontal: '5.5%', marginBottom: ms(14) },
  currentLabel: {
    fontSize: ms(10),
    fontFamily: fonts.poppins.bold,
    color: foodColors.textMuted,
    letterSpacing: 0.6,
    marginBottom: ms(6),
  },
  currentChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: foodColors.primaryLight,
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(12),
  },
  currentText: {
    fontSize: ms(12.5),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.primary,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginHorizontal: '5.5%',
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    paddingHorizontal: ms(14),
    paddingVertical: Platform.OS === 'ios' ? ms(12) : ms(4),
    marginBottom: ms(14),
  },
  searchInput: {
    flex: 1,
    fontSize: ms(13.5),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textPrimary,
    padding: 0,
    minWidth: 0,
  },

  scroll: { flex: 1 },
  content: { paddingHorizontal: '5.5%', paddingBottom: ms(16) },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
    backgroundColor: foodColors.surface,
    borderRadius: ms(14),
    paddingHorizontal: ms(14),
    paddingVertical: ms(13),
    marginBottom: ms(8),
  },
  rowIcon: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(10),
    backgroundColor: foodColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: ms(14),
    fontFamily: fonts.poppins.semiBold,
    color: foodColors.textPrimary,
  },
  empty: {
    fontSize: ms(13),
    fontFamily: fonts.poppins.regular,
    color: foodColors.textSecondary,
    textAlign: 'center',
    paddingVertical: ms(40),
  },
  spacer: { height: ms(20) },
});