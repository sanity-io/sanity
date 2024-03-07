import {type TaskCreatePayload, type TaskDocument, type TaskEditPayload} from '../../types'

/**
 * @beta
 * @hidden
 */
export type ActiveDocument = {
  documentId: string
  documentType: string
}
/**
 * @beta
 * @hidden
 */
export interface TasksContextValue {
  activeDocument: ActiveDocument | null
  setActiveDocument: (document: ActiveDocument | null) => void
  data: TaskDocument[]
  isLoading: boolean
  operations: TaskOperations
}

/**
 * @beta
 * @hidden
 */
export interface TaskOperations {
  create: (task: TaskCreatePayload) => Promise<TaskDocument>
  edit: (id: string, task: TaskEditPayload) => Promise<TaskDocument>
  remove: (id: string) => Promise<void>
}
