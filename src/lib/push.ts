import * as Notifications from 'expo-notifications';

import { api } from '@/api/client';

// Push-уведомления на телефоне.
// 1) Локальные напоминания о встрече за 2 часа — работают без сервера.
// 2) Серверные push (сообщения в чате, лист ожидания) — через Expo Push: нужен EAS projectId
//    в app.json (extra.eas.projectId) и бэкенд, который шлёт на сохранённый токен.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const pushSupported = true;

export async function enablePush(): Promise<boolean> {
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return false;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync();
    await api.registerPushToken(data);
  } catch {
    // Нет projectId (Expo Go/без EAS) — серверные push недоступны, локальные напоминания работают.
  }
  return true;
}

/** Напоминание за 2 часа до начала; если до начала меньше — не ставим. */
export async function scheduleEventReminder(event: { id: string; title: string; startsAt: string; venue: string }) {
  const at = new Date(new Date(event.startsAt).getTime() - 2 * 3_600_000);
  if (at.getTime() <= Date.now()) return;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    identifier: `reminder-${event.id}`,
    content: { title: event.title, body: event.venue, data: { url: `/event/${event.id}` } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
  });
}

export async function cancelEventReminder(eventId: string) {
  await Notifications.cancelScheduledNotificationAsync(`reminder-${eventId}`).catch(() => {});
}
