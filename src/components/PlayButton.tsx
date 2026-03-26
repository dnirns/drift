import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAppStore } from '@/store/useAppStore';
import { COLORS } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BUTTON_SIZE = 120;

const PlayIcon = () => {
  return <View style={styles.playTriangle} />;
};

const PauseIcon = () => {
  return (
    <View style={styles.pauseContainer}>
      <View style={styles.pauseBar} />
      <View style={styles.pauseBar} />
    </View>
  );
};

const PlayButton = () => {
  const isPlaying = useAppStore((s) => s.isPlaying);
  const togglePlayback = useAppStore((s) => s.togglePlayback);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      style={[styles.button, animatedStyle]}
      onPress={togglePlayback}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </AnimatedPressable>
  );
};

export default PlayButton;

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 28,
    borderTopWidth: 18,
    borderBottomWidth: 18,
    borderLeftColor: COLORS.primary,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 8,
  },
  pauseContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  pauseBar: {
    width: 10,
    height: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
});
