import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import Slider from '@/components/Slider';
import SavePresetModal from '@/components/SavePresetModal';
import SavedPresetsList from '@/components/SavedPresetsList';
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
  const savePreset = useAppStore((s) => s.savePreset);
  const [modalVisible, setModalVisible] = useState(false);

  const isCustom = noiseColor === 'custom';
  const description = NOISE_DESCRIPTIONS[noiseColor];

  const handleSave = (name: string) => {
    savePreset(name);
    setModalVisible(false);
  };

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
      <SavedPresetsList />
      <View style={styles.detailArea}>
        <View
          style={[styles.detailLayer, { opacity: isCustom ? 1 : 0 }]}
          pointerEvents={isCustom ? 'auto' : 'none'}
        >
          <Slider
            label="Spectrum"
            value={tone}
            onValueChange={setTone}
            style={styles.slider}
          />
          <Pressable
            style={styles.saveButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.saveButtonText}>Save Preset</Text>
          </Pressable>
        </View>
        <View
          style={[styles.detailLayer, { opacity: !isCustom && description != null ? 1 : 0 }]}
          pointerEvents="none"
        >
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      <SavePresetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
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
    fontFamily: 'BemboStd-Semibold',
    fontSize: 14,
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
    height: 120,
    marginHorizontal: -16,
  },
  detailLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  slider: {
    marginVertical: 0,
  },
  saveButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  saveButtonText: {
    color: COLORS.accent,
    fontFamily: 'BemboStd-Semibold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  description: {
    color: COLORS.secondary,
    fontFamily: 'BemboStd',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
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
    fontFamily: 'BemboStd-Semibold',
    fontSize: 12,
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
