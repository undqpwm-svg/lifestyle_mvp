// В веб-демо системных push нет: уведомления видны в центре уведомлений приложения.
export const pushSupported = false;
export async function enablePush(): Promise<boolean> {
  return false;
}
export async function scheduleEventReminder(_event: { id: string; title: string; startsAt: string; venue: string }) {}
export async function cancelEventReminder(_eventId: string) {}
