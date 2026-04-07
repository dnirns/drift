import { memo, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { COLORS } from '@/constants/theme';
import TimerDurationPicker from './TimerDurationPicker';

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

const getDurationParts = (
  duration: number | null,
): { hours: number; minutes: number } => {
  if (duration === null || duration <= 0) {
    return { hours: 0, minutes: 0 };
  }

  const totalMinutes = Math.floor(duration / 60);

  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
};

const getDurationLabel = (hours: number, minutes: number): string => {
  if (hours === 0 && minutes === 0) {
    return 'Choose at least 1 minute';
  }

  if (hours > 0 && minutes > 0) {
    return `${hours} hr ${minutes} min`;
  }

  if (hours > 0) {
    return `${hours} hr`;
  }

  return `${minutes} min`;
};

export default memo(function TimerModal({ visible, onClose }: TimerModalProps) {
  const timerDuration = useAppStore((s) => s.timerDuration);
  const setTimerDuration = useAppStore((s) => s.setTimerDuration);
  const setTimerRemaining = useAppStore((s) => s.setTimerRemaining);
  const [{ hours, minutes }, setCustomDuration] = useState(() =>
    getDurationParts(timerDuration),
  );
  const [isCustomPickerVisible, setIsCustomPickerVisible] = useState(false);

  const isCustomDurationActive =
    timerDuration !== null &&
    !PRESET_OPTIONS.some((option) => option.value === timerDuration);

  useEffect(() => {
    if (!visible) return;
    setCustomDuration(getDurationParts(timerDuration));
    setIsCustomPickerVisible(false);
  }, [timerDuration, visible]);

  const selectPreset = (value: number | null) => {
    setIsCustomPickerVisible(false);
    setTimerDuration(value);
    setTimerRemaining(value);
    onClose();
  };

  const setCustomTimer = () => {
    const durationInSeconds = hours * 3600 + minutes * 60;

    if (durationInSeconds <= 0) return;

    setTimerDuration(durationInSeconds);
    setTimerRemaining(durationInSeconds);
    onClose();
  };

  const toggleCustomPicker = () => {
    if (isCustomPickerVisible) {
      setIsCustomPickerVisible(false);
      return;
    }

    setCustomDuration(getDurationParts(timerDuration));
    setIsCustomPickerVisible(true);
  };

  const customDurationLabel = getDurationLabel(hours, minutes);
  const isCustomDurationValid = hours > 0 || minutes > 0;
  const isCustomSelected = isCustomPickerVisible || isCustomDurationActive;

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

            <Pressable
              testID="custom-timer-option"
              style={[
                styles.presetPill,
                isCustomSelected && styles.presetPillActive,
              ]}
              onPress={toggleCustomPicker}
            >
              <Text
                style={[
                  styles.presetText,
                  isCustomSelected && styles.presetTextActive,
                ]}
              >
                Custom
              </Text>
            </Pressable>
          </View>

          {isCustomPickerVisible ? (
            <View
              style={[
                styles.customSection,
                isCustomDurationActive && styles.customSectionActive,
              ]}
            >
              <View style={styles.customHeader}>
                <Text style={styles.customTitle}>Custom</Text>
                <Text style={styles.customValue}>{customDurationLabel}</Text>
              </View>

              <TimerDurationPicker
                hours={hours}
                minutes={minutes}
                onHoursChange={(value) =>
                  setCustomDuration((current) => ({ ...current, hours: value }))
                }
                onMinutesChange={(value) =>
                  setCustomDuration((current) => ({ ...current, minutes: value }))
                }
              />

              <View style={styles.actions}>
                <Pressable style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  testID="set-custom-timer-button"
                  style={[
                    styles.setButton,
                    !isCustomDurationValid && styles.setButtonDisabled,
                  ]}
                  onPress={setCustomTimer}
                  disabled={!isCustomDurationValid}
                >
                  <Text style={styles.setButtonText}>Set</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
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
    width: '88%',
    maxWidth: 360,
  },
  title: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.3,
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
    fontWeight: '500',
    fontSize: 14,
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  customSection: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  customSectionActive: {
    borderColor: COLORS.accent,
  },
  customHeader: {
    marginBottom: 14,
    gap: 4,
  },
  customTitle: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  customValue: {
    color: COLORS.secondary,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  cancelText: {
    color: COLORS.secondary,
    fontWeight: '500',
    fontSize: 14,
  },
  setButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  setButtonDisabled: {
    opacity: 0.4,
  },
  setButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
