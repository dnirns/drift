import { StyleSheet, Text, View, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

interface SliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
}

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;

export default function Slider({ label, value, onValueChange }: SliderProps) {
  const trackWidth = useSharedValue(0);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  function onLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    trackWidth.value = width;
    translateX.value = value * (width - THUMB_SIZE);
  }

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      const maxX = trackWidth.value - THUMB_SIZE;
      const newX = Math.min(maxX, Math.max(0, startX.value + e.translationX));
      translateX.value = newX;

      const normalized = maxX > 0 ? newX / maxX : 0;
      runOnJS(onValueChange)(normalized);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_SIZE / 2,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.trackContainer} onLayout={onLayout}>
        <View style={styles.track} />
        <Animated.View style={[styles.trackFill, fillStyle]} />
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 32,
    marginVertical: 16,
  },
  label: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  trackContainer: {
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: COLORS.trackBackground,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: COLORS.trackFill,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: COLORS.thumb,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
