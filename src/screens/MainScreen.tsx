import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlayButton from '@/components/PlayButton';
import NoiseColorSelector from '@/components/NoiseColorSelector';
import Slider from '@/components/Slider';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useAppStore } from '@/store/useAppStore';
import { COLORS } from '@/constants/theme';

export default function MainScreen() {
  useAudioEngine();

  const volume = useAppStore((s) => s.volume);
  const setVolume = useAppStore((s) => s.setVolume);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Drift</Text>
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
    paddingTop: 16,
    alignItems: 'center',
  },
  title: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 6,
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
