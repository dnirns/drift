import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import Slider from '@/components/Slider';
import type { NoiseColor } from '@/types';

interface PillProps {
  color: NoiseColor;
  label: string;
  isActive: boolean;
  onPress: (color: NoiseColor) => void;
}

const ACTIVE_COLORS: Record<NoiseColor, string> = {
  white: '#B0B0B0',
  pink: '#D4628E',
  brown: '#8B6A4A',
  blue: '#4A7BD4',
  custom: COLORS.accent,
};

const NOISE_DESCRIPTIONS: Partial<Record<NoiseColor, string>> = {
  white:
    'A sharp, steady "hiss" that covers all frequencies equally to mask sudden, disruptive background sounds.',
  pink: 'A balanced, natural sound like falling rain that reduces high pitches to promote deeper, more restorative sleep.',
  brown:
    'A deep, bass-heavy rumble resembling a distant thunderstorm that provides a warm and grounding atmosphere.',
  blue: 'A high-pitched, thin sound like a pressurized spray that is typically too piercing to be used as a traditional sleep aid.',
};

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
  const activeColor = ACTIVE_COLORS[color];
  const isCustom = color === 'custom';

  return (
    <Pressable
      style={[
        styles.pill,
        isActive && { backgroundColor: activeColor },
        isCustom && !isActive && styles.pillCustomInactive,
      ]}
      onPress={() => onPress(color)}
    >
      <Text
        style={[
          styles.pillText,
          isActive && styles.pillTextActive,
          isCustom && !isActive && styles.pillTextCustom,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
});

export default function NoiseColorSelector() {
  const noiseColor = useAppStore((s) => s.noiseColor);
  const setNoiseColor = useAppStore((s) => s.setNoiseColor);
  const tone = useAppStore((s) => s.tone);
  const setTone = useAppStore((s) => s.setTone);

  const isCustom = noiseColor === 'custom';
  const description = NOISE_DESCRIPTIONS[noiseColor];

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
      <View style={styles.detailArea}>
        {isCustom ? (
          <Slider label="Spectrum" value={tone} onValueChange={setTone} />
        ) : (
          description != null && (
            <Text style={styles.description}>{description}</Text>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
  },
  label: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  detailArea: {
    height: 88,
    justifyContent: 'center',
  },
  description: {
    color: COLORS.secondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 16,
    opacity: 0.7,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  pillCustomInactive: {
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  pillText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextCustom: {
    color: COLORS.secondary,
  },
});
