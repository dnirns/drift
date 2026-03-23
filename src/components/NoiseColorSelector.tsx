import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import type { NoiseColor } from '@/types';

interface PillProps {
  color: NoiseColor;
  label: string;
  isActive: boolean;
  onPress: (color: NoiseColor) => void;
}

const NOISE_OPTIONS: { color: NoiseColor; label: string }[] = [
  { color: 'white', label: 'White' },
  { color: 'pink', label: 'Pink' },
  { color: 'brown', label: 'Brown' },
  { color: 'blue', label: 'Blue' },
  { color: 'custom', label: 'Custom' },
];

const NoiseColorPill = memo(function NoiseColorPill({
  color,
  label,
  isActive,
  onPress,
}: PillProps) {
  return (
    <Pressable
      style={[styles.pill, isActive && styles.pillActive]}
      onPress={() => onPress(color)}
    >
      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
});

export default function NoiseColorSelector() {
  const noiseColor = useAppStore((s) => s.noiseColor);
  const setNoiseColor = useAppStore((s) => s.setNoiseColor);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Noise</Text>
      <View style={styles.row}>
        {NOISE_OPTIONS.map((option) => (
          <NoiseColorPill
            key={option.color}
            color={option.color}
            label={option.label}
            isActive={noiseColor === option.color}
            onPress={setNoiseColor}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  label: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  pillActive: {
    backgroundColor: COLORS.accent,
  },
  pillText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
