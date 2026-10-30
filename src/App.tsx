import { fetchTaskNote, saveTaskNote } from './lib/taskNotes'
import {
  fetchAllTaskReminders,
  saveTaskReminder,
  deleteTaskReminder,
} from './lib/taskReminders'

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { LocalNotifications } from '@capacitor/local-notifications'
import {
  cancelNativeReminder,
  isNativeApp,
  requestNativeNotificationPermission,
  scheduleNativeReminder,
} from './lib/nativeReminders'

import { CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardList, Clock3, Flower2, Home, Plus, Search, Settings, Sparkles, Target, Trash2, UserRound, X, BarChart3, Bell, Repeat2, Paperclip, ArrowLeft, CheckCircle2, Zap, Download, Upload, Smartphone, Sun, Moon } from 'lucide-react'

import { loadTasks, saveTasks } from './lib/tasks'

import type { Task, TaskCategory, TaskPriority } from './types/task'







type Screen = 'Tasks' | 'Calendar' | 'Stats' | 'Mine'
type AppearanceTheme = 'light' | 'dark'
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const categories: TaskCategory[] = ['Work', 'Personal', 'Wishlist', 'Study']

const categoryColors: Record<TaskCategory, string> = { Work: 'blue', Personal: 'green', Wishlist: 'pink', Study: 'purple' }

const today = () => dateKey(new Date())

function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }

function prettyDate(value: string | null) { if (!value) return 'No due date'; const d = new Date(`${value}T12:00:00`); if (value === today()) return 'Today'; return d.toLocaleDateString('en', { month: 'short', day: 'numeric' }) }



export default function App() {

  const [theme, setTheme] = useState<AppearanceTheme>(() => {
    const savedTheme = localStorage.getItem('daybloom-appearance')
    const initialTheme = savedTheme === 'dark' ? 'dark' : 'light'
    document.documentElement.dataset.theme = initialTheme
    return initialTheme
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('daybloom-appearance', theme)
  }, [theme])

  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [installMessage, setInstallMessage] = useState('')
  const [isInstalled, setIsInstalled] = useState(() =>
    isNativeApp() || window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true,
  )

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const onInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      setInstallMessage('DayBloom is installed on this device.')
    }
    window.addEventListener('beforeinstallprompt', onInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function installDayBloom() {
    if (isInstalled) {
      setInstallMessage('DayBloom is already installed on this device.')
      return
    }
    if (installPrompt) {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      setInstallPrompt(null)
      setInstallMessage(choice.outcome === 'accepted'
        ? 'DayBloom is being installed.'
        : 'No problem. You can install DayBloom whenever you like.')
      return
    }
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setInstallMessage('To install DayBloom on a phone, first publish it at an HTTPS address.')
      return
    }
    const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    setInstallMessage(isAppleMobile
      ? 'In Safari, tap Share, then choose “Add to Home Screen”.'
      : 'Open your browser menu and choose “Install app” or “Add to Home screen”.')
  }

  const [syncMessage, setSyncMessage] = useState('')

  useEffect(() => {
    if (!syncMessage) return
    const timeoutId = window.setTimeout(() => setSyncMessage(''), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [syncMessage])

  const [screen, setScreen] = useState<Screen>('Tasks')

  const [filter, setFilter] = useState<'All' | TaskCategory>('All')

  const [query, setQuery] = useState('')

  const [searchOpen, setSearchOpen] = useState(false)

  const [composerOpen, setComposerOpen] = useState(false)

  const [detailId, setDetailId] = useState<string | null>(null)

  const [draft, setDraft] = useState('')

  const [draftCategory, setDraftCategory] = useState<TaskCategory>('Personal')

  const [draftPriority, setDraftPriority] = useState<TaskPriority>('Medium')

  const [draftDate, setDraftDate] = useState(today())

  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

  const [selectedDate, setSelectedDate] = useState(today())

  const [calendarMode, setCalendarMode] = useState<'Month' | 'Week'>('Month')

  const [note, setNote] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteMessage, setNoteMessage] = useState('')
  
const [reminderAt, setReminderAt] = useState('')
const [reminderSaving, setReminderSaving] = useState(false)
const [reminderMessage, setReminderMessage] = useState('')

const [reminders, setReminders] = useState(() => fetchAllTaskReminders())
const [notificationPermission, setNotificationPermission] =
  useState<NotificationPermission>(
    typeof Notification !== 'undefined'
      ? Notification.permission
      : 'denied'
  )

useEffect(() => {
  const refreshNotificationPermission = () => {
    if (isNativeApp()) {
      void LocalNotifications.checkPermissions().then(permission => {
        setNotificationPermission(permission.display as NotificationPermission)
      })
    } else if (typeof Notification !== 'undefined') {
      setNotificationPermission(Notification.permission)
    }
  }
  refreshNotificationPermission()
  window.addEventListener('focus', refreshNotificationPermission)
  document.addEventListener('visibilitychange', refreshNotificationPermission)
  return () => {
    window.removeEventListener('focus', refreshNotificationPermission)
    document.removeEventListener('visibilitychange', refreshNotificationPermission)
  }
}, [])

useEffect(() => {
  if (notificationPermission === 'granted') {
    setReminderMessage(message => message.startsWith('Please allow notifications for ') ? '' : message)
  }
}, [notificationPermission])


  const [subtaskDraft, setSubtaskDraft] = useState('')

  const [subtasks, setSubtasks] = useState<Record<string, {id:string; title:string; done:boolean}[]>>(() => {
    try { return JSON.parse(localStorage.getItem('daybloom.subtasks.v1') || '{}') } catch { return {} }
  })

  const [statsTaskFilter, setStatsTaskFilter] = useState<'All' | 'Completed' | 'Active'>('All')

  useEffect(() => {
    if (!isNativeApp()) return
    let disposed = false
    const handles: { remove: () => Promise<void> }[] = []
    void LocalNotifications.addListener('localNotificationReceived', event => {
      const taskId = event.extra?.taskId
      if (typeof taskId !== 'string') return
      void deleteTaskReminder(taskId)
      setReminders(current => current.filter(item => item.task_id !== taskId))
    }).then(handle => {
      if (disposed) void handle.remove()
      else handles.push(handle)
    })
    void LocalNotifications.addListener('localNotificationActionPerformed', event => {
      const taskId = event.notification.extra?.taskId
      if (typeof taskId !== 'string') return
      void deleteTaskReminder(taskId)
      setReminders(current => current.filter(item => item.task_id !== taskId))
      setScreen('Tasks')
      setDetailId(taskId)
    }).then(handle => {
      if (disposed) void handle.remove()
      else handles.push(handle)
    })
    return () => {
      disposed = true
      handles.forEach(handle => void handle.remove())
    }
  }, [])

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  useEffect(() => {
    try { localStorage.setItem('daybloom.subtasks.v1', JSON.stringify(subtasks)) } catch { /* storage can be unavailable in private browsing */ }
  }, [subtasks])

  const activeTask = tasks.find(t => t.id === detailId) ?? null
  
const notifiedReminderIds = useRef(new Set<string>())

// Reminders are saved on this device with the task list.

// Display the selected task's saved reminder in local time.
useEffect(() => {
  const existing = reminders.find(
    item => item.task_id === activeTask?.id
  )

  if (existing) {
    const date = new Date(existing.remind_at)
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    )

    setReminderAt(localDate.toISOString().slice(0, 16))
  } else {
    setReminderAt('')
  }

  setReminderMessage('')
}, [activeTask?.id, reminders])


  // Check for due reminders while DayBloom is open.
  useEffect(() => {
    if (isNativeApp()) return
    let cancelled = false
    let checking = false

    async function checkReminders() {
      if (cancelled || checking) return

      checking = true

      try {
        const dueReminders = reminders.filter(
          reminder =>
            Date.parse(reminder.remind_at) <= Date.now() &&
            !notifiedReminderIds.current.has(reminder.task_id)
        )

        if (dueReminders.length === 0) return

        for (const reminder of dueReminders) {
          if (cancelled) return

          const task = tasks.find(
            item => item.id === reminder.task_id
          )

          if (!task) continue

          let delivered = false
          if (window.isSecureContext && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const options = { body: task.title, tag: `reminder-${reminder.task_id}` }
            try {
              if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration()
                if (registration?.active) {
                  await registration.showNotification('DayBloom reminder', options)
                  delivered = true
                }
              }
              if (!delivered) new Notification('DayBloom reminder', options)
              delivered = true
            } catch (error) {
              console.warn('Browser notification failed; showing an in-app reminder.', error)
            }
          }

          if (!delivered) {
            setSyncMessage(
              window.isSecureContext
                ? `Reminder due: ${task.title}. Allow notifications for this site to receive browser alerts.`
                : `Reminder due: ${task.title}. This HTTP address cannot show browser notifications; open DayBloom over HTTPS for alerts.`,
            )
          }

          notifiedReminderIds.current.add(reminder.task_id)

          // Remove the one-time reminder after displaying it.
          await deleteTaskReminder(reminder.task_id)

          if (!cancelled) {
            setReminders(current =>
              current.filter(
                item => item.task_id !== reminder.task_id
              )
            )
          }
        }
      } catch (error) {
        console.error('DayBloom notification error:', error)

        if (!cancelled) {
          setReminderMessage(
            error instanceof Error
              ? `Notification error: ${error.message}`
              : 'Could not display the reminder notification.'
          )
        }
      } finally {
        checking = false
      }
    }

    void checkReminders()

    const interval = window.setInterval(() => {
      void checkReminders()
    }, 15000)
    const onWake = () => void checkReminders()
    window.addEventListener('focus', onWake)
    document.addEventListener('visibilitychange', onWake)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('focus', onWake)
      document.removeEventListener('visibilitychange', onWake)
    }
  }, [notificationPermission, reminders, tasks])


  
async function handleSaveReminder() {
  if (!activeTask) return

  if (!reminderAt) {
    setReminderMessage('Please choose a reminder date and time.')
    return
  }

  const remindAt = new Date(reminderAt)

  if (Number.isNaN(remindAt.getTime()) || remindAt <= new Date()) {
    setReminderMessage('Choose a future date and time.')
    return
  }

  setReminderSaving(true)
  setReminderMessage('')

  try {
    let permission: NotificationPermission = 'denied'
    let nativeWarning: string | null = null
    if (isNativeApp()) {
      const allowed = await requestNativeNotificationPermission()
      if (!allowed) throw new Error('Allow DayBloom notifications in your phone settings to schedule reminders.')
      permission = 'granted'
      setNotificationPermission(permission)
      nativeWarning = await scheduleNativeReminder(activeTask.id, activeTask.title, remindAt)
    } else if (window.isSecureContext && typeof Notification !== 'undefined') {
      permission = Notification.permission
      if (permission !== 'granted') permission = await Notification.requestPermission()
      setNotificationPermission(permission)
    }

    notifiedReminderIds.current.delete(activeTask.id)
    await saveTaskReminder(activeTask.id, remindAt.toISOString())

    setReminders(current => [
      ...current.filter(item => item.task_id !== activeTask.id),
      {
        task_id: activeTask.id,
        remind_at: remindAt.toISOString(),
      },
    ])

    setReminderMessage(isNativeApp()
      ? nativeWarning
        ? `Reminder saved, but Android may deliver it a little late: ${nativeWarning}`
        : 'Reminder scheduled on this phone. It can arrive while DayBloom is closed.'
      : permission === 'granted'
        ? 'Reminder saved. Keep DayBloom open for it to appear.'
      : 'Reminder saved. Keep DayBloom open to see an in-app alert; browser notifications need HTTPS or localhost.')
  } catch (error) {
    setReminderMessage(
      error instanceof Error
        ? `Could not save reminder: ${error.message}`
        : 'Could not save reminder.'
    )
  } finally {
    setReminderSaving(false)
  }
}

async function handleDeleteReminder() {
  if (!activeTask) return

  setReminderSaving(true)
  setReminderMessage('')

  try {
    if (isNativeApp()) await cancelNativeReminder(activeTask.id)
    await deleteTaskReminder(activeTask.id)
    setReminders(current =>
      current.filter(item => item.task_id !== activeTask.id)
    )
    setReminderAt('')
    setReminderMessage('Reminder removed.')
  } catch (error) {
    setReminderMessage(
      error instanceof Error
        ? `Could not remove reminder: ${error.message}`
        : 'Could not remove reminder.'
    )
  } finally {
    setReminderSaving(false)
  }
}

  
useEffect(() => {
  if (!activeTask) return

  let cancelled = false

  async function loadNote() {
    setNoteLoading(true)
    setNoteMessage('')

    try {
      const content = await fetchTaskNote(activeTask!.id)

      if (!cancelled) {
        setNote(content)
      }
    } catch (error) {
      if (!cancelled) {
        setNoteMessage(
          error instanceof Error
            ? `Could not load note: ${error.message}`
            : 'Could not load note.'
        )
      }
    } finally {
      if (!cancelled) setNoteLoading(false)
    }
  }

  void loadNote()

  return () => {
    cancelled = true
  }
}, [activeTask?.id])


  const visibleTasks = useMemo(() => tasks.filter(t => (filter === 'All' || t.category === filter) && (!query || t.title.toLowerCase().includes(query.toLowerCase()))), [tasks, filter, query])

  const todayTasks = tasks.filter(t => t.dueDate === today())

  const doneToday = todayTasks.filter(t => t.completed).length

  const completed = tasks.filter(t => t.completed).length

  const completion = tasks.length ? Math.round(completed / tasks.length * 100) : 0

  const statsFilteredTasks = tasks.filter(t => statsTaskFilter === 'All' || (statsTaskFilter === 'Completed' ? t.completed : !t.completed))

  const statsCategorySegments = (['Work','Personal','Wishlist','Study'] as TaskCategory[]).map((category, index, all) => { const count = statsFilteredTasks.filter(t => t.category === category).length; const percent = statsFilteredTasks.length ? count / statsFilteredTasks.length * 100 : 0; const colors = ['#1d58b8','#afc6ff','#ffb3af','#a18bdc']; const offset = all.slice(0,index).reduce((sum,c) => sum + (statsFilteredTasks.length ? statsFilteredTasks.filter(t => t.category === c).length / statsFilteredTasks.length * 100 : 0),0); return {category,count,percent,offset,color:colors[index]} })

  const weeklyStats = Array.from({length:7},(_,i)=>{ const start = new Date(); start.setDate(start.getDate()-((start.getDay()-i+7)%7)); const key = dateKey(start); return {day:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i],count:tasks.filter(t=>t.completed&&(t.dueDate===key||(!t.dueDate&&t.createdAt.slice(0,10)===key))).length} })



  const selectedTasks = tasks.filter(t => t.dueDate === selectedDate)

  const monthDays = useMemo(() => { const first = new Date(month.getFullYear(), month.getMonth(), 1); const offset = first.getDay(); const start = new Date(first); start.setDate(first.getDate() - offset); return Array.from({length: 42}, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d }) }, [month])
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  useEffect(() => {
  if (!timerRunning) return

  const interval = window.setInterval(() => {
    setTimerSeconds((seconds) => seconds + 1)
  }, 1000)

  return () => window.clearInterval(interval)
}, [timerRunning])

function formatTimer(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function exportBackup() {
  const backup = {
    format: 'daybloom-local-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: loadTasks(),
    notes: localStorage.getItem('daybloom.notes.v1') ?? '{}',
    reminders: localStorage.getItem('daybloom.reminders.v1') ?? '[]',
    subtasks: localStorage.getItem('daybloom.subtasks.v1') ?? '{}',
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `daybloom-backup-${dateKey(new Date())}.json`
  link.click()
  URL.revokeObjectURL(url)
  setSyncMessage('Backup downloaded.')
}

async function restoreBackup(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  try {
    const backup = JSON.parse(await file.text())
    if (backup.format !== 'daybloom-local-backup' || backup.version !== 1 || !Array.isArray(backup.tasks)) {
      throw new Error('This file is not a valid DayBloom backup.')
    }
    if (!window.confirm('Restore this backup? It will replace the DayBloom data saved in this browser.')) return
    localStorage.setItem('daybloom.tasks.v1', JSON.stringify(backup.tasks))
    localStorage.setItem('daybloom.notes.v1', typeof backup.notes === 'string' ? backup.notes : '{}')
    localStorage.setItem('daybloom.reminders.v1', typeof backup.reminders === 'string' ? backup.reminders : '[]')
    localStorage.setItem('daybloom.subtasks.v1', typeof backup.subtasks === 'string' ? backup.subtasks : '{}')
    window.location.reload()
  } catch (error) {
    setSyncMessage(error instanceof Error ? error.message : 'Could not restore this backup.')
  }
}


async function handleDueDateChange(value: string) {
  if (!activeTask) return

  const updatedTask: Task = {
    ...activeTask,
    dueDate: value || null,
  }

  setTasks(current =>
    current.map(item => item.id === activeTask.id ? updatedTask : item),
  )

  setSyncMessage('Task updated on this device.')
}


async function addTask(e: FormEvent) {

  e.preventDefault()

  const title = draft.trim()

  if (!title) return



  const task: Task = {

    id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.random() * 16 | 0
  const v = c === 'x' ? r : (r & 0x3 | 0x8)
  return v.toString(16)
}),

    title,

    category: draftCategory,

    priority: draftPriority,

    dueDate: draftDate || null,

    completed: false,

    createdAt: new Date().toISOString(),

  }



  // Save locally first so the UI responds immediately.

  setTasks(current => [task, ...current])

  setDraft('')

  setComposerOpen(false)

  setFilter('All')

  setScreen('Tasks')

  setSelectedDate(task.dueDate ?? today())



  setSyncMessage('Task saved on this device.')

}



async function toggleTask(id: string) {


  const task = tasks.find(item => item.id === id)

  if (!task) return



  const updatedTask: Task = {

    ...task,

    completed: !task.completed,

  }



  setTasks(current =>

    current.map(item => item.id === id ? updatedTask : item),

  )



  setSyncMessage('Task updated on this device.')

}

async function handleSaveNote() {
  if (!activeTask) return

  setNoteSaving(true)
  setNoteMessage('')

  try {
    await saveTaskNote(activeTask.id, note)
    setNoteMessage('Note saved successfully.')
  } catch (error) {
    setNoteMessage(
      error instanceof Error
        ? `Could not save note: ${error.message}`
        : 'Could not save note.'
    )
  } finally {
    setNoteSaving(false)
  }
}




async function deleteTask(id: string) {


  const task = tasks.find(item => item.id === id)



  setTasks(current => current.filter(item => item.id !== id))



  if (detailId === id) {

    setDetailId(null)

  }



  if (task) {
    if (isNativeApp()) await cancelNativeReminder(id)
    await deleteTaskReminder(id)
    setReminders(current => current.filter(item => item.task_id !== id))
    setSyncMessage('Task removed from this device.')
  }

}









  function addSubtask(e: FormEvent) { e.preventDefault(); if (!activeTask || !subtaskDraft.trim()) return; setSubtasks(s => ({...s, [activeTask.id]: [...(s[activeTask.id] ?? []), {id: crypto.randomUUID(), title: subtaskDraft.trim(), done:false}]})); setSubtaskDraft('') }

  function moveMonth(amount: number) { setMonth(m => new Date(m.getFullYear(), m.getMonth() + amount, 1)) }



return <div className="app-shell">

  {syncMessage && (

  <div className="sync-status" role="status">

    {syncMessage}

  </div>

)}

    <header className="mobile-header"><div className="mobile-brand"><span className="brand-icon"><Flower2 size={21}/></span><span>daybloom<span className="brand-dot">.</span></span></div><div className={`header-actions ${searchOpen ? 'search-open' : ''}`}>{searchOpen && <input className="search-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tasks" autoFocus/>}<button className="icon-button" aria-label="Search" onClick={()=>setSearchOpen(v=>!v)}><Search size={20}/></button><button className="avatar-button" onClick={()=>setScreen('Mine')} aria-label="Profile"><UserRound size={17}/></button></div></header>

    <main className="main-wrap">

      {detailId && activeTask ? <section className="detail-screen">

        <div className="detail-top"><button className="back-button" onClick={()=>setDetailId(null)}><ArrowLeft size={19}/><span>Back to tasks</span></button><button className="icon-button" aria-label="Delete task" onClick={()=>deleteTask(activeTask.id)}><Trash2 size={18}/></button></div>

        <div className="detail-card"><div className="detail-badge"><ClipboardList size={16}/> TASK DETAILS</div><div className="detail-title-row"><button className={`big-check ${activeTask.completed?'checked':''}`} onClick={()=>toggleTask(activeTask.id)} aria-label="Toggle completion">{activeTask.completed && <Check size={18}/>}</button><h1 className={activeTask.completed?'struck':''}>{activeTask.title}</h1></div><div className="detail-tags"><span className={`category-pill ${categoryColors[activeTask.category]}`}>{activeTask.category}</span><span className={`priority-pill ${activeTask.priority.toLowerCase()}`}>{activeTask.priority} priority</span></div>

          <div className="detail-options"><div className="option-row"><span className="option-icon"><CalendarDays size={18}/></span><div><small>Due date</small><strong>{prettyDate(activeTask.dueDate)}</strong></div><input aria-label="Change due date" type="date" value={activeTask.dueDate ?? ''} onChange={e=>void handleDueDateChange(e.target.value)}/></div>
<div className="detail-tools-grid">
<div className="detail-section">
  <h3>Activity Timer</h3>

  <div className="activity-timer-display">
    {formatTimer(timerSeconds)}
  </div>

  <div className="activity-timer-actions">
    <button
      type="button"
      className="primary-button"
      onClick={() => setTimerRunning((running) => !running)}
    >
      {timerRunning
        ? 'Pause'
        : timerSeconds > 0
          ? 'Resume'
          : 'Start'}
    </button>

    <button
      type="button"
      className="secondary-button"
      onClick={() => {
        setTimerRunning(false)
        setTimerSeconds(0)
      }}
    >
      Reset
    </button>
  </div>
</div>

<div className="detail-section">
  <h3>Reminder</h3>

  {(() => {
    const savedReminder = reminders.find(
      item => item.task_id === activeTask.id
    )

    return (
      <>
        <label className="field-label" htmlFor="task-reminder">
          Choose date and time
        </label>

        <input
          id="task-reminder"
          className="text-field"
          type="datetime-local"
          value={reminderAt}
          onChange={event => setReminderAt(event.target.value)}
          disabled={reminderSaving}
        />

        <button
          type="button"
          className="primary-button"
          onClick={() => void handleSaveReminder()}
          disabled={reminderSaving}
        >
          <Bell size={17} />
          {reminderSaving ? 'Saving...' : 'Save reminder'}
        </button>

        {savedReminder && (
          <div>
            <p>
              Reminder set for{' '}
              {new Date(savedReminder.remind_at).toLocaleString()}
            </p>

            <button
              type="button"
              className="delete-button"
              onClick={() => void handleDeleteReminder()}
              disabled={reminderSaving}
            >
              Remove reminder
            </button>
          </div>
        )}
        
        {reminderMessage && (
          <p role="status" aria-live="polite">
            {reminderMessage}
          </p>
        )}

        {!isNativeApp() && notificationPermission !== 'granted' && (
          !window.isSecureContext
            ? <p>Browser notifications require HTTPS or localhost. This address uses HTTP, so reminders will appear as in-app alerts while DayBloom is open.</p>
            : <p>Notification permission is “{notificationPermission}” for {window.location.host}. Allow it in this site’s browser settings, then return to DayBloom.</p>
        )}
      </>
    )
  })()}
</div>
</div><div className="option-row"><span className="option-icon"><Repeat2 size={18}/></span><div><small>Repeat cycle</small><strong>Does not repeat</strong></div><span className="option-muted">—</span></div></div>

          <div className="detail-section"><h3>Subtasks <span>{(subtasks[activeTask.id]??[]).filter(s=>s.done).length}/{(subtasks[activeTask.id]??[]).length}</span></h3>{(subtasks[activeTask.id]??[]).map(s=><label className="subtask-row" key={s.id}><input type="checkbox" checked={s.done} onChange={()=>setSubtasks(all=>({...all,[activeTask.id]:(all[activeTask.id]??[]).map(x=>x.id===s.id?{...x,done:!x.done}:x)}))}/><span className={s.done?'struck':''}>{s.title}</span></label>)}<form className="subtask-form" onSubmit={addSubtask}><Plus size={17}/><input value={subtaskDraft} onChange={e=>setSubtaskDraft(e.target.value)} placeholder="Add a subtask…"/><button type="submit" aria-label="Add subtask"><Plus size={17}/></button></form></div>
          

<div className="detail-section">
  <h3>Notes</h3>

  <textarea
    className="notes-input"
    value={note}
    onChange={event => setNote(event.target.value)}
    placeholder={
      noteLoading
        ? 'Loading saved note...'
        : 'Add a note to help you remember...'
    }
    disabled={noteLoading}
  />

  <button
    type="button"
    className="primary-button"
    onClick={() => void handleSaveNote()}
    disabled={noteLoading || noteSaving}
  >
    {noteSaving ? 'Saving...' : 'Save note'}
  </button>

  {noteMessage && (
    <p role="status" aria-live="polite">
      {noteMessage}
    </p>
  )}

  <div className="attachment-hint">
    <Paperclip size={16} />
    Attachments <span>Coming soon</span>
  </div>
</div>
   </div>

      </section> : <>

        {screen === 'Tasks' && <section className="screen-content">

          <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR LITTLE PLAN</div><h1>Tasks <span className="title-sparkle">✦</span></h1><p className="page-subtitle">A little progress goes a long way.</p></div><button className="primary-button" onClick={()=>setComposerOpen(true)}><Plus size={18}/> <span>New task</span></button></div>

          <div className="category-filters"><button className={filter==='All'?'selected':''} onClick={()=>setFilter('All')}>All <span>{tasks.length}</span></button>{categories.map(c=><button key={c} className={filter===c?'selected':''} onClick={()=>setFilter(c)}>{c} <span>{tasks.filter(t=>t.category===c).length}</span></button>)}</div>

          <div className="today-banner"><div className="banner-icon"><Sparkles size={21}/></div><div className="banner-copy"><strong>{todayTasks.length ? `${doneToday} of ${todayTasks.length} tasks completed today` : 'Make space for what matters'}</strong><span>{todayTasks.length ? 'Every check is a little win.' : 'Choose one small thing to begin with.'}</span><div className="banner-progress"><span style={{width:`${todayTasks.length?Math.round(doneToday/todayTasks.length*100):0}%`}}/></div></div><div className="banner-flower">✿</div></div>

          <div className="section-heading"><div><h2>{filter==='All'?'Your tasks':filter}</h2><p>{visibleTasks.filter(t=>!t.completed).length} left to bloom · {visibleTasks.filter(t=>t.completed).length} completed</p></div><button className="subtle-icon" onClick={()=>setComposerOpen(true)} aria-label="Add task"><Plus size={20}/></button></div>

          <div className="task-stack">{visibleTasks.length===0 ? <div className="empty-card"><div className="empty-flower">🌱</div><h3>A little breathing room.</h3><p>Nothing here just yet. Add a task and let your day bloom.</p><button className="primary-button" onClick={()=>setComposerOpen(true)}><Plus size={17}/> Add your first task</button></div> : visibleTasks.map(task=><article className={`task-card ${task.completed?'task-done':''}`} key={task.id}><button className={`task-check ${task.completed?'checked':''}`} onClick={()=>toggleTask(task.id)} aria-label={task.completed?'Mark incomplete':'Complete task'}>{task.completed&&<Check size={15}/>}</button><button className="task-card-main" onClick={()=>{setDetailId(task.id);setNote('')}}><span className="task-card-title">{task.title}</span><span className="task-card-meta"><span className={`category-pill ${categoryColors[task.category]}`}>{task.category}</span><span className="task-due"><CalendarDays size={13}/>{prettyDate(task.dueDate)}</span></span></button><span className={`priority-dot ${task.priority.toLowerCase()}`} title={`${task.priority} priority`}/><button className="delete-button" aria-label="Delete task" onClick={()=>deleteTask(task.id)}><Trash2 size={16}/></button></article>)}</div>

          <div className="gentle-footer"><Flower2 size={16}/><span>Progress over perfection, always.</span></div>

        </section>}

        {screen === 'Calendar' && <section className="screen-content calendar-screen">

          <div className="calendar-page-heading"><div className="calendar-heading-brand"><CalendarDays size={22}/><h1>Calendar</h1></div><div className="calendar-heading-actions"><button className="icon-button" aria-label="Search tasks" onClick={()=>{setScreen('Tasks');setSearchOpen(true)}}><Search size={20}/></button><button className="icon-button" aria-label="Filter tasks" onClick={()=>setScreen('Tasks')}><Settings size={19}/></button><button className="avatar-button" onClick={()=>setScreen('Mine')} aria-label="Profile"><UserRound size={17}/></button></div></div>

          <div className="calendar-card reference-calendar">

            <div className="reference-calendar-top"><div className="reference-month-group"><h2>{month.toLocaleDateString('en',{month:'long',year:'numeric'})}</h2><div className="reference-month-arrows"><button onClick={()=>moveMonth(-1)} aria-label="Previous month"><ChevronLeft size={18}/></button><button onClick={()=>moveMonth(1)} aria-label="Next month"><ChevronRight size={18}/></button></div></div><div className="reference-calendar-controls"><div className="calendar-mode-toggle"><button className={calendarMode==='Month'?'active':''} onClick={()=>setCalendarMode('Month')}>Month</button><button className={calendarMode==='Week'?'active':''} onClick={()=>setCalendarMode('Week')}>Week</button></div><button className="calendar-today-button" onClick={()=>{setMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1));setSelectedDate(today())}}>Today</button></div></div>

            <div className="reference-weekdays">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><span key={d}>{d}</span>)}</div>

            <div className={`reference-calendar-grid ${calendarMode==='Week'?'week-mode':''}`}>{(calendarMode==='Week'?monthDays.filter(d=>{const sel=new Date(`${selectedDate}T12:00:00`);const start=new Date(sel);start.setDate(sel.getDate()-sel.getDay());const end=new Date(start);end.setDate(start.getDate()+6);return d>=start&&d<=end}):monthDays).map(d=>{const key=dateKey(d);const inMonth=d.getMonth()===month.getMonth();const dayTasks=tasks.filter(t=>t.dueDate===key);const selected=selectedDate===key;return <button key={key} className={`reference-day ${!inMonth?'outside-month':''} ${selected?'selected':''} ${key===today()?'is-today':''}`} onClick={()=>setSelectedDate(key)} aria-label={`${key}${dayTasks.length?`, ${dayTasks.length} tasks`:''}`}><span className={`reference-day-number ${dayTasks.length?`has-${categoryColors[dayTasks[0].category]}`:''} ${dayTasks.length&&dayTasks.every(t=>t.completed)?'all-complete':''}`}>{d.getDate()}</span><span className="reference-day-dots">{dayTasks.slice(0,3).map(t=><i key={t.id} className={categoryColors[t.category]}/>)}</span></button>})}</div>

            <div className="calendar-summary-strip"><span className="calendar-summary-icon"><CalendarDays size={19}/></span><div><strong>{selectedTasks.length} {selectedTasks.length===1?'Task':'Tasks'} Scheduled</strong><span>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en',{weekday:'long',month:'short',day:'numeric',year:'numeric'})}</span></div><Sparkles size={26} className="calendar-summary-sparkle"/></div>

          </div>

          <div className="reference-agenda-heading"><div><CalendarDays size={19}/><h2>Daily Agenda</h2></div><span>{selectedTasks.length} {selectedTasks.length===1?'Task':'Tasks'}</span></div>

          <div className="reference-agenda">{selectedTasks.length?selectedTasks.map(task=><article className={`agenda-card agenda-${categoryColors[task.category]} ${task.completed?'agenda-complete':''}`} key={task.id}><span className="agenda-accent"/><span className={`agenda-category-icon ${categoryColors[task.category]}`}>{task.category==='Work'?<ClipboardList size={19}/>:task.category==='Personal'?<Flower2 size={19}/>:task.category==='Wishlist'?<Sparkles size={19}/>:<Target size={19}/>}</span><button className="agenda-task-main" onClick={()=>{setDetailId(task.id);setNote('')}}><strong>{task.title}</strong><span><Clock3 size={13}/>{task.priority} priority <b>·</b> {task.category}</span></button><button className={`agenda-check ${task.completed?'checked':''}`} aria-label={task.completed?'Mark incomplete':'Mark completed'} onClick={()=>toggleTask(task.id)}>{task.completed?<Check size={17}/>:<span/>}</button><button className="delete-button" aria-label="Delete task" onClick={()=>deleteTask(task.id)}><Trash2 size={15}/></button></article>):<div className="empty-inline"><CalendarDays size={22}/><span>A clear day is a lovely place to start.</span><button onClick={()=>{setDraftDate(selectedDate);setComposerOpen(true)}}>Add a task</button></div>}</div>

        </section>}

        {screen === 'Stats' && <section className="screen-content stats-screen">

          <div className="stats-page-heading"><div className="stats-heading-brand"><BarChart3 size={22}/><h1>Stats</h1></div><div className="stats-heading-actions"><button className="icon-button" aria-label="Search tasks" onClick={()=>{setScreen('Tasks');setSearchOpen(true)}}><Search size={20}/></button><button className="icon-button" aria-label="Filter tasks" onClick={()=>setScreen('Tasks')}><Settings size={19}/></button><button className="stats-avatar" aria-label="Profile" onClick={()=>setScreen('Mine')}><UserRound size={17}/></button></div></div>

          <div className="stats-content">

            <div className="achievement-banner stats-achievement"><div className="achievement-icon"><Target size={21}/></div><div><strong>Achievement Records at a Glance</strong><p>Every completed task builds your rhythm!</p></div><Sparkles size={23}/></div>

            <div className="stats-metric-grid">

              <div className="stats-metric-card"><div className="stats-metric-top"><small>Completed Tasks</small><span className="stats-metric-icon blue"><CheckCircle2 size={18}/></span></div><div className="stats-metric-number">{completed}<span className="stats-metric-trend"><Check size={13}/> {completed ? 'Keep it up' : 'Start today'}</span></div><div className="stats-progress-track"><i className="blue" style={{width:`${completion}%`}}/></div></div>

              <div className="stats-metric-card"><div className="stats-metric-top"><small>All Done Days</small><span className="stats-metric-icon green"><CheckCircle2 size={18}/></span></div><div className="stats-metric-number">{new Set(tasks.filter(t=>t.dueDate && tasks.some(other=>other.dueDate===t.dueDate) && tasks.filter(other=>other.dueDate===t.dueDate).every(other=>other.completed)).map(t=>t.dueDate)).size}<span className="stats-metric-unit">days</span></div><div className="stats-progress-track"><i className="green" style={{width:`${Math.min(100, new Set(tasks.filter(t=>t.dueDate && tasks.filter(other=>other.dueDate===t.dueDate).every(other=>other.completed)).map(t=>t.dueDate)).size/30*100)}%`}}/></div></div>

            </div>

            <div className="stats-panel annual-panel"><div className="stats-panel-heading"><div className="stats-panel-title"><CalendarDays size={19}/><h2>Annual Activity Tracker</h2></div><span className="stats-year">{new Date().getFullYear()} <ChevronRight size={15}/></span></div><div className="annual-heatmap-wrap"><div className="heatmap-month-labels"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span></div><div className="stats-heatmap">{Array.from({length:Math.ceil((new Date().getDay()+((new Date().getFullYear()%4===0&&new Date().getMonth()>=1)?1:0)+ (new Date().getMonth()===0?0:Math.floor((new Date(new Date().getFullYear(),new Date().getMonth(),0).getTime()-new Date(new Date().getFullYear(),0,1).getTime())/86400000))+1)/7)*7},(_,i)=>{const jan1=new Date(new Date().getFullYear(),0,1);const offset=jan1.getDay();const d=new Date(new Date().getFullYear(),0,1+i-offset);const key=dateKey(d);const count=tasks.filter(t=>t.completed&&(t.dueDate===key||(!t.dueDate&&t.createdAt.slice(0,10)===key))).length;return <span key={i} title={`${key}: ${count} completed`} className={`stats-heat-cell ${d.getFullYear()!==new Date().getFullYear()?'heat-empty-year':''} level-${count===0?0:count===1?1:count<=3?2:3}`}/>})}</div></div><div className="stats-heatmap-legend"><span>Daily Activity</span><div><span>Less</span>{[0,1,2,3].map(n=><i key={n} className={`stats-heat-cell level-${n}`}/>)}<span>More</span></div></div></div>

            <div className="stats-panel distribution-panel"><div className="stats-panel-heading"><div><h2>Task Distribution</h2><p>By active category</p></div><select aria-label="Task distribution filter" className="stats-filter-select" value={statsTaskFilter} onChange={e=>setStatsTaskFilter(e.target.value as 'All'|'Completed'|'Active')}><option value="All">All Tasks</option><option value="Completed">Completed Tasks</option><option value="Active">Active Tasks</option></select></div><div className="distribution-content"><div className="donut-wrap"><svg viewBox="0 0 100 100" aria-label="Task distribution chart"><circle cx="50" cy="50" r="38" className="donut-track"/>{statsCategorySegments.map(seg=><circle key={seg.category} cx="50" cy="50" r="38" fill="none" stroke={seg.color} strokeWidth="12" strokeDasharray={`${seg.percent/100*238.76} ${238.76-seg.percent/100*238.76}`} strokeDashoffset={`${-seg.offset/100*238.76}`}/>)}</svg><div className="donut-center"><strong>{statsFilteredTasks.length}</strong><span>Total</span></div></div><div className="distribution-legend">{(['Work','Personal','Wishlist','Study'] as TaskCategory[]).map(c=>{const count=statsFilteredTasks.filter(t=>t.category===c).length;const pct=statsFilteredTasks.length?Math.round(count/statsFilteredTasks.length*100):0;return <div className="distribution-row" key={c}><span className={`distribution-dot ${categoryColors[c]}`}/><span className="distribution-name">{c}</span><strong>{count}</strong><small>{pct}%</small></div>})}</div></div></div>

            <div className="stats-panel weekly-panel"><div className="stats-panel-heading"><div><h2>Weekly Accomplishment</h2><p>Sunday to Saturday trend</p></div><span className="peak-pill">Peak: {weeklyStats.reduce((a,b)=>b.count>a.count?b:a,weeklyStats[0]).day} ({Math.max(0,...weeklyStats.map(d=>d.count))})</span></div><div className="weekly-chart">{weeklyStats.map((d,i)=>{const max=Math.max(1,...weeklyStats.map(x=>x.count));return <div className="weekly-bar-column" key={d.day}><span className={d.count===max&&d.count>0?'weekly-value peak':'weekly-value'}>{d.count}</span><div className="weekly-bar-track"><i className={d.count===max&&d.count>0?'peak-bar':i===2?'mid-bar':'soft-bar'} style={{height:`${Math.max(3,d.count/max*100)}%`}}/></div><span className={d.count===max&&d.count>0?'weekly-day peak-day':'weekly-day'}>{d.day}</span></div>})}</div></div>

            <div className="stats-summary-grid"><div className="stats-summary-card"><span className="stats-summary-icon"><Target size={19}/></span><div><small>Completion Rate</small><strong>{completion}%</strong></div></div><div className="stats-summary-card"><span className="stats-summary-icon green"><Zap size={19}/></span><div><small>Most Productive</small><strong>{weeklyStats.reduce((a,b)=>b.count>a.count?b:a,weeklyStats[0]).count?weeklyStats.reduce((a,b)=>b.count>a.count?b:a,weeklyStats[0]).day:'—'}</strong></div></div></div>

          </div>

        </section>}

{screen === 'Mine' && <section className="screen-content mine-screen"><div className="profile-hero"><div className="profile-flower">✿</div><div className="profile-avatar"><UserRound size={31}/></div><h1>Your little corner</h1><p>Your tasks are saved in this browser 🌱</p><span className="member-pill">ON THIS DEVICE</span></div><div className="profile-summary"><div><strong>{tasks.length}</strong><span>Total tasks</span></div><div><strong>{completed}</strong><span>Completed</span></div><div><strong>{completion}%</strong><span>Progress</span></div></div><div className="appearance-card"><div className="appearance-copy"><span className="settings-icon">{theme === 'light' ? <Sun size={19}/> : <Moon size={19}/>}</span><span><strong>Appearance</strong><small>Choose light or dark mode</small></span></div><div className="appearance-switch" role="group" aria-label="Appearance"><button type="button" className={theme === 'light' ? 'active' : ''} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Sun size={15}/><span>Light</span></button><button type="button" className={theme === 'dark' ? 'active' : ''} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Moon size={15}/><span>Dark</span></button></div></div><div className="settings-list"><button onClick={()=>setScreen('Stats')}><span className="settings-icon"><BarChart3 size={19}/></span><span><strong>My progress</strong><small>Celebrate your little wins</small></span><ChevronRight size={18}/></button><button onClick={()=>setComposerOpen(true)}><span className="settings-icon"><Plus size={19}/></span><span><strong>Create a task</strong><small>Make room for what matters</small></span><ChevronRight size={18}/></button><button onClick={()=>void installDayBloom()}><span className="settings-icon"><Smartphone size={19}/></span><span><strong>{isInstalled ? 'DayBloom is installed' : 'Install DayBloom'}</strong><small>Add DayBloom to your phone’s home screen</small></span><ChevronRight size={18}/></button><button onClick={exportBackup}><span className="settings-icon"><Download size={19}/></span><span><strong>Download a backup</strong><small>Save your tasks and notes as a file</small></span><ChevronRight size={18}/></button><button onClick={()=>document.getElementById('daybloom-restore-backup')?.click()}><span className="settings-icon"><Upload size={19}/></span><span><strong>Restore a backup</strong><small>Replace this browser’s data from a file</small></span><ChevronRight size={18}/></button></div>{installMessage && <p className="install-message" role="status">{installMessage}</p>}<input id="daybloom-restore-backup" type="file" accept="application/json,.json" hidden onChange={event=>void restoreBackup(event)}/><p className="mine-quote">Data stays in this browser. Export a backup before clearing browser data or moving to another device.</p></section>}

      </>}

    </main>

    {!detailId && <><button className="floating-add" onClick={()=>{setDraftDate(screen==='Calendar'?selectedDate:today());setComposerOpen(true)}} aria-label="Add task"><Plus size={24}/></button><nav className="bottom-nav" aria-label="Main navigation">{([{name:'Tasks' as Screen,icon:ClipboardList},{name:'Calendar' as Screen,icon:CalendarDays},{name:'Stats' as Screen,icon:BarChart3},{name:'Mine' as Screen,icon:Home}]).map(item=>{const Icon=item.icon;return <button key={item.name} className={screen===item.name?'nav-active':''} onClick={()=>setScreen(item.name)}><span className="nav-icon"><Icon size={21}/></span><span>{item.name}</span></button>})}</nav></>}

    {composerOpen && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setComposerOpen(false)}}><section className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="composer-title"><div className="modal-heading"><div className="modal-flower"><Flower2 size={21}/></div><div><h2 id="composer-title">Plant a new task</h2><p>One small step is enough.</p></div><button className="icon-button" onClick={()=>setComposerOpen(false)} aria-label="Close"><X size={20}/></button></div><form onSubmit={addTask}><label className="field-label" htmlFor="task-title">What would you like to do?</label><input id="task-title" className="text-field" autoFocus value={draft} onChange={e=>setDraft(e.target.value)} placeholder="e.g. Read a chapter, call a friend…" required/><label className="field-label">Add it to a list</label><div className="category-choice">{categories.map(c=><button type="button" key={c} className={draftCategory===c?'choice-active':''} onClick={()=>setDraftCategory(c)}><span className={`category-dot ${categoryColors[c]}`}/>{c}</button>)}</div><div className="field-row"><div><label className="field-label" htmlFor="task-date">Due date</label><input id="task-date" className="text-field" type="date" value={draftDate} onChange={e=>setDraftDate(e.target.value)}/></div><div><label className="field-label" htmlFor="task-priority">Priority</label><select id="task-priority" className="text-field" value={draftPriority} onChange={e=>setDraftPriority(e.target.value as TaskPriority)}><option>Low</option><option>Medium</option><option>High</option></select></div></div><button className="primary-button submit-task" type="submit"><Plus size={18}/> Create task</button></form></section></div>}

  </div>

}
