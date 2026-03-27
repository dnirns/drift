import { memo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { COLORS } from '@/constants/theme';

interface TimerModalProps {
  visible: boolean;
  onClose: () => void;
}

interface PresetOption {
  label: string;
  value: number | null;
}

const PRESET_OPTIONS: PresetOption[] = [
  { label: '∞', value: null },
  { label: '1 Hour', value: 3600 },
  { label: '4 Hours', value: 14400 },
  { label: '8 Hours', value: 28800 },
];

export default memo(function TimerModal({ visible, onClose }: TimerModalProps) {
  const timerDuration = useAppStore((s) => s.timerDuration);
  const setTimerDuration = useAppStore((s) => s.setTimerDuration);
  const setTimerRemaining = useAppStore((s) => s.setTimerRemaining);

  const selectPreset = (value: number | null) => {
    setTimerDuration(value);
    setTimerRemaining(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Sleep Timer</Text>

          <View style={styles.presets}>
            {PRESET_OPTIONS.map((option) => (
              <Pressable
                key={option.label}
                style={[
                  styles.presetPill,
                  timerDuration === option.value && styles.presetPillActive,
                ]}
                onPress={() => selectPreset(option.value)}
              >
                <Text
                  style={[
                    styles.presetText,
                    timerDuration === option.value && styles.presetTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  title: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  presetPill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: COLORS.trackBackground,
  },
  presetPillActive: {
    backgroundColor: COLORS.accent,
  },
  presetText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
});
