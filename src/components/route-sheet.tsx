import { Bus, Car, CarTaxiFront, Footprints, MapPin, Navigation } from 'lucide-react-native';
import { useState } from 'react';
import { Platform } from 'react-native';

import type { GeoPoint } from '@/api/types';
import type { CityId } from '@/config/cities';
import { type DgisRouteType, openIn2gis } from '@/lib/dgis';
import { useAppSettings } from '@/state/app-settings';

import { Button } from './ui/button';
import type { LucideIcon } from './ui/icon';
import { Sheet, SheetOption } from './ui/sheet';

const MODES: { type: DgisRouteType; icon: LucideIcon }[] = [
  { type: 'pedestrian', icon: Footprints },
  { type: 'ctx', icon: Bus },
  { type: 'car', icon: Car },
  { type: 'taxi', icon: CarTaxiFront },
];

/** «Как добраться»: выбор способа и переход в 2GIS с готовым маршрутом от текущего местоположения */
export function RouteSheet({
  to,
  cityId,
  address,
  onClose,
}: {
  to: GeoPoint;
  cityId: CityId;
  address: string;
  onClose: () => void;
}) {
  const { t } = useAppSettings();
  const go = (type?: DgisRouteType) => {
    onClose();
    openIn2gis(to, cityId, type).catch(() => {});
  };
  return (
    <Sheet visible onClose={onClose} title={t.route.title}>
      {MODES.map((m) => (
        <SheetOption key={m.type} icon={m.icon} label={t.route[m.type]} onPress={() => go(m.type)} />
      ))}
      <SheetOption icon={MapPin} label={t.route.showOnMap} hint={address} onPress={() => go()} />
    </Sheet>
  );
}

/**
 * Кнопка «Маршрут в 2GIS». В приложении — шторка выбора способа,
 * в браузере deeplink с типом маршрута не работает, поэтому сразу открываем 2gis.kz.
 */
export function RouteButton({ to, cityId, address }: { to: GeoPoint; cityId: CityId; address: string }) {
  const { t } = useAppSettings();
  const [open, setOpen] = useState(false);
  const onPress = () => (Platform.OS === 'web' ? openIn2gis(to, cityId).catch(() => {}) : setOpen(true));
  return (
    <>
      <Button title={t.route.button} icon={Navigation} variant="ghost" onPress={onPress} />
      {open ? <RouteSheet to={to} cityId={cityId} address={address} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
