import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AudioEngineBinding from '@/audio/AudioEngineBinding';
import MainScreen from '@/screens/MainScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AudioEngineBinding />
        <StatusBar style="light" />
        <MainScreen />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
