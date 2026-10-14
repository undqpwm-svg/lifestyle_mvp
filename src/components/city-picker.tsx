import { ChevronDown, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { CITIES, getCity, type CityId } from '@/config/cities';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon } from './ui/icon';
import { Sheet, SheetOption } from './ui/sheet';
import { Text } from './ui/text';

// «Пилюля» с городом. По умолчанию управляет городом ленты; можно передать value/onChange
// (например, в онбординге и формах).
export function CityPicker({ value, onChange }: { value?: CityId; onChange?: (id: CityId) => void }) {
  const { colors } = useTheme();
  const settings = useAppSettings();
  const [open, setOpen] = useState(false);
  const current = value ?? settings.cityId;
  const select = onChange ?? settings.setCity;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Icon icon={MapPin} size={15} />
        <Text variant="caption">{getCity(current).name[settings.lang]}</Text>
        <Icon icon={ChevronDown} size={15} color="textMuted" />
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={settings.t.cityPicker.title}>
        {CITIES.map((c) => (
          <SheetOption
            key={c.id}
            label={c.name[settings.lang]}
            active={c.id === current}
            onPress={() => {
              select(c.id);
              setOpen(false);
            }}
          />
        ))}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
