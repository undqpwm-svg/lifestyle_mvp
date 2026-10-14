import {
  ChefHat,
  Coffee,
  Dices,
  Drama,
  Dumbbell,
  Footprints,
  Goal,
  GraduationCap,
  Guitar,
  Laptop,
  Palette,
  Spade,
  Store,
  Trees,
  Volleyball,
} from 'lucide-react-native';

import type { InterestId, OrgType } from '@/api/types';

import { BasketballIcon, TennisBallIcon, type LucideIcon } from './ui/icon';

export const INTEREST_ICONS: Record<InterestId, LucideIcon> = {
  volleyball: Volleyball,
  football: Goal,
  basketball: BasketballIcon,
  tennis: TennisBallIcon,
  running: Footprints,
  boardgames: Dices,
  mafia: Drama,
  cooking: ChefHat,
  workshops: GraduationCap,
  walks: Trees,
  music: Guitar,
  tech: Laptop,
};

export const ORG_TYPE_ICONS: Record<OrgType, LucideIcon> = {
  cafe: Coffee,
  sports: Dumbbell,
  club: Spade,
  studio: Palette,
  other: Store,
};
