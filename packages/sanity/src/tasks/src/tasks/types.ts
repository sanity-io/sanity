import {PortableTextBlock, User} from '@sanity/types'

/**
 * @beta
 * @hidden
 */
export interface Loadable<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
}

/**
 * @beta
 * @hidden
 */
export interface TaskOperations {
  create: (task: TaskCreatePayload) => Promise<TaskDocument>
  edit: (id: string, task: TaskEditPayload) => Promise<TaskDocument>
  remove: (id: string) => Promise<void>
  update: (id: string, task: Partial<TaskCreatePayload>) => Promise<void>
}

/**
 * @beta
 * @hidden
 */

export type MentionOptionsHookValue = Loadable<MentionOptionUser[]>

/**
 * @beta
 * @hidden
 */
export interface MentionOptionUser extends User {
  canBeMentioned: boolean
}

/**
 * @beta
 * @hidden
 */
export type TaskMessage = PortableTextBlock[] | null

/**
 * @beta
 * @hidden
 */
export type TaskStatus = 'open' | 'closed'

/**
 * @beta
 * @hidden
 */
export interface TaskContext {
  tool?: string
  payload?: Record<string, unknown>
  notification?: {
    documentTitle: string
    url: string
    workspaceTitle: string
  }
}

interface TaskCreateRetryingState {
  type: 'createRetrying'
}

interface TaskCreateFailedState {
  type: 'createError'
  error: Error
}

/**
 * The state is used to track the state of the task (e.g. if it failed to be created, etc.)
 * It is a local value and is not stored on the server.
 * When there's no state, the task is considered to be in a "normal" state (e.g. created successfully).
 *
 * The state value is primarily used to update the UI. That is, to show an error message or retry button.
 */
type TaskState = TaskCreateFailedState | TaskCreateRetryingState | undefined

/**
 * @beta
 * @hidden
 */
export interface TaskDocument {
  _type: 'tasks.task'
  _createdAt: string
  _updatedAt: string
  _id: string
  _rev: string
  _state?: TaskState
  title: string
  description: TaskMessage
  status: TaskStatus
  lastEditedAt?: string
  context?: TaskContext
  authorId: string
  dueBy?: string
  assignedTo?: string

  target?: {
    documentType: string
    document: {
      _dataset: string
      _projectId: string
      _ref: string
      _type: 'crossDatasetReference'
      _weak: boolean
    }
  }
}

/**
 * @beta
 * @hidden
 */
export type TaskPostPayload = Omit<TaskDocument, '_rev' | '_updatedAt' | '_createdAt'>

/**
 * @beta
 * @hidden
 */
export interface TaskCreatePayload {
  id?: string
  title: string
  description: TaskMessage
  status: TaskStatus
}

/**
 * @beta
 * @hidden
 */
export type TaskEditPayload = {
  title: string
  description?: TaskMessage
  lastEditedAt?: string
}
