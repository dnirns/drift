import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppStore } from '@/store/useAppStore';
import { formatTimeRemaining } from '@/utils/formatTime';
import { COLORS } from '@/constants/theme';
import TimerModal from './TimerModal';

// countdown display for the top left
export const TimerCountdown = memo(function TimerCountdown() {
  const timerDuration = useAppStore((s) => s.timerDuration);
  const timerRemaining = useAppStore((s) => s.timerRemaining);
  const isPlaying = useAppStore((s) => s.isPlaying);

  const isActive = timerDuration !== null;

  const getDisplayText = (): string => {
    if (!isActive) return '';
    if (isPlaying && timerRemaining !== null) {
      return formatTimeRemaining(timerRemaining);
    }
    return formatTimeRemaining(timerRemaining ?? timerDuration);
  };

  if (!isActive) return <View style={styles.countdownContainer} />;

  return (
    <View style={styles.countdownContainer}>
      <Text style={styles.countdownText}>{getDisplayText()}</Text>
    </View>
  );
});

// timer icon button for the top right
export default memo(function TimerButton() {
  const [modalVisible, setModalVisible] = useState(false);

  const timerDuration = useAppStore((s) => s.timerDuration);
  const isActive = timerDuration !== null;

  return (
    <View style={styles.buttonContainer}>
      <Pressable
        onPress={() => setModalVisible(true)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.iconButton,
          isActive && styles.iconButtonActive,
          pressed && styles.iconButtonPressed,
        ]}
      >
        <MaterialIcons
          name={isActive ? 'timer' : 'all-inclusive'}
          size={isActive ? 30 : 34}
          color={isActive ? COLORS.accent : COLORS.secondary}
        />
      </Pressable>
      <TimerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  countdownContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  countdownText: {
    color: COLORS.accent,
    fontWeight: '600',
    fontSize: 22,
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: COLORS.accent + '20',
  },
  iconButtonPressed: {
    opacity: 0.6,
  },
});
