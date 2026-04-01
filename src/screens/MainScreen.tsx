import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlayButton from '@/components/PlayButton';
import NoiseColorSelector from '@/components/NoiseColorSelector';
import TimerButton from '@/components/TimerButton';
import Slider from '@/components/Slider';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useTimer } from '@/hooks/useTimer';
import { useAppStore } from '@/store/useAppStore';
import { COLORS } from '@/constants/theme';

export default function MainScreen() {
  useAudioEngine();
  useTimer();

  const volume = useAppStore((s) => s.volume);
  const setVolume = useAppStore((s) => s.setVolume);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.title}>Drift</Text>
        <TimerButton />
      </View>

      <View style={styles.center}>
        <PlayButton />
      </View>

      <View style={styles.sliders}>
        <NoiseColorSelector />
        <Slider label="Volume" value={volume} onValueChange={setVolume} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  headerSpacer: {
    flex: 1,
  },
  title: {
    color: COLORS.primary,
    fontWeight: '300',
    fontSize: 22,
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliders: {
    paddingBottom: 32,
  },
});
