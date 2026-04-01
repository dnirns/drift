import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { formatTimeRemaining } from '@/utils/formatTime';
import { COLORS } from '@/constants/theme';
import TimerModal from './TimerModal';

export default memo(function TimerButton() {
  const [modalVisible, setModalVisible] = useState(false);

  const timerDuration = useAppStore((s) => s.timerDuration);
  const timerRemaining = useAppStore((s) => s.timerRemaining);
  const isPlaying = useAppStore((s) => s.isPlaying);

  const getDisplayText = (): string => {
    if (timerDuration === null) return '∞';
    if (isPlaying && timerRemaining !== null) {
      return formatTimeRemaining(timerRemaining);
    }
    return formatTimeRemaining(timerRemaining ?? timerDuration);
  };

  const isActive = timerDuration !== null;

  return (
    <View style={styles.button}>
      <Pressable
        onPress={() => setModalVisible(true)}
        hitSlop={8}
      >
        <Text style={[styles.text, !isActive && styles.infinity, isActive && styles.textActive]}>
          {getDisplayText()}
        </Text>
      </Pressable>
      <TimerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'flex-end',
  },
  text: {
    color: COLORS.secondary,
    fontWeight: '300',
    fontSize: 16,
  },
  infinity: {
    fontSize: 24,
  },
  textActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
});
