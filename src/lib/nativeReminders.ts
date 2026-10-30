import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

function notificationId(taskId: string): number {
  let hash = 0
  for (const character of taskId) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) | 0
  return (hash & 0x7fffffff) || 1
}

export async function requestNativeNotificationPermission(): Promise<boolean> {
  let permission = await LocalNotifications.checkPermissions()
  if (permission.display !== 'granted') {
    permission = await LocalNotifications.requestPermissions()
  }
  return permission.display === 'granted'
}

export async function scheduleNativeReminder(
  taskId: string,
  title: string,
  at: Date,
): Promise<string | null> {
  const result = await LocalNotifications.schedule({
    notifications: [{
      id: notificationId(taskId),
      title: 'DayBloom reminder',
      body: title,
      schedule: { at, allowWhileIdle: true },
      extra: { taskId },
      foreground: true,
      isExactNotification: true,
    }],
  })
  return result.warning?.message ?? null
}

export async function cancelNativeReminder(taskId: string): Promise<void> {
  await LocalNotifications.cancel({ notifications: [{ id: notificationId(taskId) }] })
}
