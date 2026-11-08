// Who is handling this order: the laundry partner that accepted it (E-Wash) or the restaurant (E-Chop).
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { foodColors } from '../../constants/foodColors';
import { fonts } from '../../constants/typography';
import { ms } from '../../utils/responsive';

type Partner = { name: string; logo_url: string | null; kind: string; accepted_at: string | null };

export function OrderPartner({ orderId, type, status }: { orderId: string; type: 'echop' | 'ewash'; status?: string | null }) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Reload when the status changes (e.g. a laundry has just accepted).
  useEffect(() => {
    let live = true;
    supabase.rpc('hemera_order_partner', { p_order: orderId }).then(({ data }) => {
      if (!live) return;
      const row = Array.isArray(data) ? (data as any[])[0] : null;
      setPartner(row ? { name: row.name, logo_url: row.logo_url ?? null, kind: row.kind, accepted_at: row.accepted_at ?? null } : null);
      setLoaded(true);
    });
    return () => { live = false; };
  }, [orderId, status]);

  if (!loaded) return null;
  const label = type === 'ewash' ? 'Laundry partner' : 'Restaurant';
  return (
    <View style={styles.card}>
      {partner?.logo_url ? (
        <Image source={{ uri: partner.logo_url }} style={styles.logo} />
      ) : (
        <View style={[styles.logo, styles.logoEmpty]}>
          <MaterialCommunityIcons name={type === 'ewash' ? 'washing-machine' : 'storefront-outline'} size={ms(20)} color={foodColors.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {partner ? (
          <>
            <Text style={styles.name}>{partner.name}</Text>
            {partner.accepted_at && (
              <Text style={styles.sub}>
                Accepted {new Date(partner.accepted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.waiting}>{type === 'ewash' ? 'Waiting for a laundry partner to accept your order…' : 'Waiting for the restaurant…'}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: ms(12), backgroundColor: foodColors.surface, borderRadius: ms(16), padding: ms(14), marginBottom: ms(16), borderWidth: 1, borderColor: foodColors.border },
  logo: { width: ms(44), height: ms(44), borderRadius: ms(22), borderWidth: 1, borderColor: foodColors.border },
  logoEmpty: { backgroundColor: foodColors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: ms(11), fontFamily: fonts.poppins.medium, color: foodColors.textSecondary },
  name: { fontSize: ms(14), fontFamily: fonts.poppins.semiBold, color: foodColors.textPrimary },
  sub: { fontSize: ms(11.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
  waiting: { fontSize: ms(12.5), fontFamily: fonts.poppins.regular, color: foodColors.textSecondary },
});
