import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainScreen from '@/screens/MainScreen';

export default function App() {
  const [fontsLoaded] = useFonts({
    'BemboStd': require('./assets/fonts/BemboStd.ttf'),
    'BemboStd-Semibold': require('./assets/fonts/BemboStd-Semibold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <MainScreen />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
