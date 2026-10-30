export type TaskCategory = 'Personal' | 'Work' | 'Study' | 'Wishlist'
export type TaskPriority = 'Low' | 'Medium' | 'High'

export interface Task {
  id: string
  title: string
  category: TaskCategory
  priority: TaskPriority
  dueDate: string | null
  completed: boolean
  createdAt: string
}
