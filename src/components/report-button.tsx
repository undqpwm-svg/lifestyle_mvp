import { useState } from 'react';
import { Pressable } from 'react-native';

import { useReport } from '@/api/queries';
import type { ID, ReportReason, ReportTarget } from '@/api/types';
import { useAppSettings } from '@/state/app-settings';

import { Sheet, SheetOption } from './ui/sheet';
import { Text } from './ui/text';

const REASONS: ReportReason[] = ['spam', 'fraud', 'offensive', 'other'];

// Жалоба на пользовательский контент. Обязательна для публикации соцсети в App Store / Google Play.
export function ReportButton({ target, targetId, compact }: { target: ReportTarget; targetId: ID; compact?: boolean }) {
  const { t } = useAppSettings();
  const [open, setOpen] = useState(false);
  const report = useReport();

  return (
    <>
      <Pressable hitSlop={10} onPress={() => setOpen(true)} accessibilityLabel={t.common.report}>
        <Text variant="caption" color="textFaint">
          {report.isSuccess ? t.common.reportSent : compact ? '•••' : `⚑ ${t.common.report}`}
        </Text>
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={t.common.reportTitle}>
        {REASONS.map((reason) => (
          <SheetOption
            key={reason}
            label={t.common.reasons[reason]}
            onPress={() => {
              report.mutate({ target, targetId, reason });
              setOpen(false);
            }}
          />
        ))}
      </Sheet>
    </>
  );
}
