import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';

import { fonts } from '../../constants/typography';
import { ms } from '../../utils/responsive';

type Props = {
  uri: string | null | undefined;
  name: string;
  size: number;
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

export function Avatar({ uri, name, size }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={[dimension, { backgroundColor: '#FFE3D6' }]}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={[
        dimension,
        { backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' },
      ]}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.36, fontFamily: fonts.poppins.semiBold }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}