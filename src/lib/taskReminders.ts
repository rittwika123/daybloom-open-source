const REMINDERS_KEY = 'daybloom.reminders.v1'

export interface TaskReminder {
  task_id: string
  remind_at: string
}

export function fetchAllTaskReminders(): TaskReminder[] {
  try {
    const value = JSON.parse(localStorage.getItem(REMINDERS_KEY) || '[]')
    return Array.isArray(value) ? value.filter(item =>
      item && typeof item.task_id === 'string' && typeof item.remind_at === 'string'
    ) : []
  } catch {
    return []
  }
}

export function saveTaskReminder(taskId: string, remindAt: string): void {
  const reminders = fetchAllTaskReminders().filter(item => item.task_id !== taskId)
  reminders.push({ task_id: taskId, remind_at: remindAt })
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders))
}

export function deleteTaskReminder(taskId: string): void {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(
    fetchAllTaskReminders().filter(item => item.task_id !== taskId),
  ))
}
