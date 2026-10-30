const NOTES_KEY = 'daybloom.notes.v1'

function readNotes(): Record<string, string> {
  try {
    const value = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

export async function fetchTaskNote(taskId: string): Promise<string> {
  return readNotes()[taskId] || ''
}

export async function saveTaskNote(taskId: string, content: string): Promise<void> {
  const notes = readNotes()
  if (content) notes[taskId] = content
  else delete notes[taskId]
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}
