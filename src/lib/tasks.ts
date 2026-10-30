import type { Task } from '../types/task'

const STORAGE_KEY = 'daybloom.tasks.v1'

const starterTasks: Task[] = []
const demoTaskIds = new Set(['seed-1', 'seed-2', 'seed-3'])

export function loadTasks(): Task[] {
  try {
    let raw = localStorage.getItem(STORAGE_KEY)

    // Preserve task lists saved by earlier signed-in versions of DayBloom.
    if (!raw) {
      const legacyKey = Object.keys(localStorage).find(key => key.startsWith(`${STORAGE_KEY}.`))
      if (legacyKey) {
        raw = localStorage.getItem(legacyKey)
        if (raw) localStorage.setItem(STORAGE_KEY, raw)
      }
    }

    if (!raw) return starterTasks

    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) return starterTasks

    return parsed.filter(
      (item): item is Task =>
        Boolean(
          item &&
            typeof item.id === 'string' &&
            typeof item.title === 'string' &&
            typeof item.completed === 'boolean' &&
            !demoTaskIds.has(item.id),
        ),
    )
  } catch {
    return starterTasks
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tasks),
    )
  } catch {
    // Keep the app usable in restricted/private browsing contexts.
  }
}

export function clearTasks(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors.
  }
}
