import { memo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { COLORS } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

export default memo(function SavedPresetsList() {
  const savedPresets = useAppStore((s) => s.savedPresets);
  const activePresetId = useAppStore((s) => s.activePresetId);
  const loadPreset = useAppStore((s) => s.loadPreset);
  const deletePreset = useAppStore((s) => s.deletePreset);

  if (savedPresets.length === 0) return null;

  const handleLongPress = (id: string, name: string) => {
    Alert.alert('Delete Preset', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePreset(id) },
    ]);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {savedPresets.map((preset) => {
        const isActive = preset.id === activePresetId;
        return (
          <Pressable
            key={preset.id}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => loadPreset(preset.id)}
            onLongPress={() => handleLongPress(preset.id, preset.name)}
          >
            <Text
              style={[styles.pillText, isActive && styles.pillTextActive]}
              numberOfLines={1}
            >
              {preset.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: {
    marginTop: 10,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: 'transparent',
    maxWidth: 140,
  },
  pillActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  pillText: {
    color: COLORS.accent,
    fontFamily: 'BemboStd-Semibold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
