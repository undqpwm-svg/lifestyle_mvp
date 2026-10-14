import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { CITIES, getCity } from '@/config/cities';
import { useAppSettings } from '@/state/app-settings';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Text } from './ui/text';

// Кнопка-«пилюля» с текущим городом + модальный список городов.
export function CityPicker() {
  const { colors } = useTheme();
  const { cityId, setCity, lang, t } = useAppSettings();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Text variant="caption">📍 {getCity(cityId).name[lang]} ▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.background }]}>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>
              {t.cityPicker.title}
            </Text>
            {CITIES.map((c) => {
              const active = c.id === cityId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setCity(c.id);
                    setOpen(false);
                  }}
                  style={[
                    styles.option,
                    { borderColor: colors.line, backgroundColor: active ? colors.accentSoft : 'transparent' },
                  ]}>
                  <Text variant="bodyStrong">{c.name[lang]}</Text>
                  {active ? <Text variant="bodyStrong">✓</Text> : null}
                </Pressable>
              );
            })}
            <View style={{ height: spacing.sm }} />
            <Pressable onPress={() => setOpen(false)} style={styles.close}>
              <Text color="textMuted">{t.cityPicker.close}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  close: { alignItems: 'center', paddingVertical: spacing.md },
});
