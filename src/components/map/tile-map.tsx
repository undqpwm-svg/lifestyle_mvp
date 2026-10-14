import { Image } from 'expo-image';
import { Minus, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import type { GeoPoint } from '@/api/types';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon, type LucideIcon } from '../ui/icon';
import { Text } from '../ui/text';

// Лёгкая карта на растровых тайлах OpenStreetMap: работает на iOS, Android и в вебе без нативных модулей.
// Для продакшена в Казахстане — 2GIS MapGL/SDK (лучше покрытие, поиск по адресам) или react-native-maps;
// публичные тайлы OSM по правилам сервиса не предназначены для большой нагрузки.

const TILE = 256;
const MIN_Z = 11;
const MAX_Z = 17;

export type MapPin = { id: string; point: GeoPoint; icon: LucideIcon; active?: boolean };

/** Широта/долгота → пиксели «мировой» картинки на масштабе z (Web Mercator). */
function project({ lat, lng }: GeoPoint, z: number) {
  const n = 2 ** z * TILE;
  const s = Math.sin((lat * Math.PI) / 180);
  return { x: ((lng + 180) / 360) * n, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n };
}

type Props = {
  center: GeoPoint;
  pins: MapPin[];
  onPinPress: (id: string) => void;
  attribution: string;
  initialZoom?: number;
};

export function TileMap({ center, pins, onPinPress, attribution, initialZoom = 13 }: Props) {
  const { colors } = useTheme();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(initialZoom);
  // Сдвиг центра в пикселях относительно точки center (меняется перетаскиванием)
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState({ x: 0, y: 0 });

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) + Math.abs(g.dy) > 4,
        onPanResponderMove: (_e, g) => setDrag({ x: g.dx, y: g.dy }),
        onPanResponderRelease: (_e, g) => {
          setOffset((o) => ({ x: o.x - g.dx, y: o.y - g.dy }));
          setDrag({ x: 0, y: 0 });
        },
        onPanResponderTerminate: () => setDrag({ x: 0, y: 0 }),
      }),
    [],
  );

  const changeZoom = (delta: number) => {
    const z = Math.min(MAX_Z, Math.max(MIN_Z, zoom + delta));
    if (z === zoom) return;
    const k = 2 ** (z - zoom);
    setOffset((o) => ({ x: o.x * k, y: o.y * k }));
    setZoom(z);
  };

  const c = project(center, zoom);
  const cx = c.x + offset.x - drag.x;
  const cy = c.y + offset.y - drag.y;
  const left = cx - size.w / 2;
  const top = cy - size.h / 2;

  const tiles: { key: string; x: number; y: number; url: string }[] = [];
  if (size.w > 0) {
    const max = 2 ** zoom;
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + size.w) / TILE); tx++) {
      for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + size.h) / TILE); ty++) {
        if (ty < 0 || ty >= max) continue;
        const wx = ((tx % max) + max) % max;
        tiles.push({ key: `${zoom}/${tx}/${ty}`, x: tx * TILE - left, y: ty * TILE - top, url: `https://tile.openstreetmap.org/${zoom}/${wx}/${ty}.png` });
      }
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.surfaceAlt }]} onLayout={(e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} {...pan.panHandlers}>
      {tiles.map((t) => (
        <Image key={t.key} source={{ uri: t.url }} style={[styles.tile, { left: t.x, top: t.y }]} cachePolicy="memory-disk" />
      ))}

      {pins.map((p) => {
        const pt = project(p.point, zoom);
        const x = pt.x - left;
        const y = pt.y - top;
        if (x < -30 || y < -30 || x > size.w + 30 || y > size.h + 30) return null;
        const s = p.active ? 44 : 34;
        return (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            onPress={() => onPinPress(p.id)}
            hitSlop={6}
            style={[
              styles.pin,
              {
                left: x - s / 2,
                top: y - s,
                width: s,
                height: s,
                backgroundColor: p.active ? colors.accent : colors.inverse,
                borderColor: p.active ? colors.inverse : colors.surface,
                zIndex: p.active ? 2 : 1,
              },
            ]}>
            {/* Метка-«капля» повёрнута на 45°, иконку разворачиваем обратно */}
            <View style={styles.unrotate}>
              <Icon icon={p.icon} size={p.active ? 22 : 17} color={p.active ? 'onAccent' : 'onInverse'} />
            </View>
          </Pressable>
        );
      })}

      <View style={styles.zoom}>
        {[
          { icon: Plus, d: 1 },
          { icon: Minus, d: -1 },
        ].map((b) => (
          <Pressable
            key={b.d}
            accessibilityRole="button"
            accessibilityLabel={b.d > 0 ? 'zoom in' : 'zoom out'}
            onPress={() => changeZoom(b.d)}
            style={[styles.zoomBtn, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Icon icon={b.icon} size={18} />
          </Pressable>
        ))}
      </View>
      <View style={[styles.attr, { backgroundColor: colors.surface }]}>
        <Text variant="label" color="textMuted" style={{ fontSize: 10 }}>
          {attribution}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  tile: { position: 'absolute', width: TILE, height: TILE },
  pin: {
    position: 'absolute',
    borderRadius: 999,
    borderBottomRightRadius: 4,
    transform: [{ rotate: '45deg' }],
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unrotate: { transform: [{ rotate: '-45deg' }] },
  zoom: { position: 'absolute', right: spacing.md, top: spacing.md, gap: spacing.sm },
  zoomBtn: { width: 40, height: 40, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  attr: { position: 'absolute', right: 0, bottom: 0, paddingHorizontal: 6, paddingVertical: 2, borderTopLeftRadius: 6 },
});
