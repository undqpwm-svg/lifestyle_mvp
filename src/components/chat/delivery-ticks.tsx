import { Check, CheckCheck } from 'lucide-react-native';

import type { DeliveryStatus } from '@/api/types';
import { palette } from '@/theme/tokens';

import { Icon } from '../ui/icon';

// Галочки в личке: одна серая — не доставлено, две серые — доставлено, две зелёные — прочитано.
const GREY = 'rgba(17,17,17,0.45)';
const READ = '#138A3E';

export function DeliveryTicks({ status, size = 15, onDark }: { status: DeliveryStatus; size?: number; onDark?: boolean }) {
  const grey = onDark ? 'rgba(255,255,255,0.75)' : GREY;
  if (status === 'sent') return <Icon icon={Check} size={size} tint={grey} strokeWidth={2.4} />;
  return <Icon icon={CheckCheck} size={size} tint={status === 'read' ? (onDark ? palette.yellow : READ) : grey} strokeWidth={2.4} />;
}
