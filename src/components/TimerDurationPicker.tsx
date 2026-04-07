import { memo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '@/constants/theme';

interface TimerDurationPickerProps {
  hours: number;
  minutes: number;
  onHoursChange: (hours: number) => void;
  onMinutesChange: (minutes: number) => void;
}

interface FallbackColumnProps {
  label: string;
  testID: string;
  options: number[];
  selectedValue: number;
  onSelect: (value: number) => void;
  formatLabel?: (value: number) => string;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => index);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index);

const hasNativePicker =
  Platform.OS !== 'web' &&
  Boolean(UIManager.getViewManagerConfig?.('RNCPicker'));

const FallbackColumn = memo(function FallbackColumn({
  label,
  testID,
  options,
  selectedValue,
  onSelect,
  formatLabel = (value) => String(value),
}: FallbackColumnProps) {
  return (
    <View style={styles.column}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.fallbackShell}>
        <ScrollView
          testID={testID}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.fallbackContent}
        >
          {options.map((value) => {
            const isSelected = value === selectedValue;

            return (
              <Pressable
                key={value}
                style={[
                  styles.fallbackOption,
                  isSelected && styles.fallbackOptionSelected,
                ]}
                onPress={() => onSelect(value)}
              >
                <Text
                  style={[
                    styles.fallbackOptionText,
                    isSelected && styles.fallbackOptionTextSelected,
                  ]}
                >
                  {formatLabel(value)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
});

export default memo(function TimerDurationPicker({
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
}: TimerDurationPickerProps) {
  if (!hasNativePicker) {
    return (
      <View style={styles.container}>
        <FallbackColumn
          label="Hours"
          testID="custom-hours-picker"
          options={HOUR_OPTIONS}
          selectedValue={hours}
          onSelect={onHoursChange}
        />
        <FallbackColumn
          label="Minutes"
          testID="custom-minutes-picker"
          options={MINUTE_OPTIONS}
          selectedValue={minutes}
          onSelect={onMinutesChange}
          formatLabel={(value) => String(value).padStart(2, '0')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.column}>
        <Text style={styles.label}>Hours</Text>
        <View style={styles.pickerShell}>
          <Picker
            testID="custom-hours-picker"
            selectedValue={hours}
            onValueChange={(value) => onHoursChange(Number(value))}
            itemStyle={styles.pickerItem}
            style={styles.picker}
          >
            {HOUR_OPTIONS.map((value) => (
              <Picker.Item key={value} label={String(value)} value={value} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.column}>
        <Text style={styles.label}>Minutes</Text>
        <View style={styles.pickerShell}>
          <Picker
            testID="custom-minutes-picker"
            selectedValue={minutes}
            onValueChange={(value) => onMinutesChange(Number(value))}
            itemStyle={styles.pickerItem}
            style={styles.picker}
          >
            {MINUTE_OPTIONS.map((value) => (
              <Picker.Item
                key={value}
                label={String(value).padStart(2, '0')}
                value={value}
              />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  label: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pickerShell: {
    backgroundColor: COLORS.trackBackground,
    borderRadius: 14,
    overflow: 'hidden',
    height: Platform.OS === 'ios' ? 180 : 56,
    justifyContent: 'center',
  },
  picker: {
    color: COLORS.primary,
    height: Platform.OS === 'ios' ? 180 : 56,
    width: '100%',
  },
  pickerItem: {
    color: COLORS.primary,
    fontSize: 24,
  },
  fallbackShell: {
    backgroundColor: COLORS.trackBackground,
    borderRadius: 14,
    height: 180,
    overflow: 'hidden',
  },
  fallbackContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 8,
  },
  fallbackOption: {
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackOptionSelected: {
    backgroundColor: COLORS.accent,
  },
  fallbackOptionText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '500',
  },
  fallbackOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
