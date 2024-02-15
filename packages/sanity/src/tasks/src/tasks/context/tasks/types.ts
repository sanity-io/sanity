import {type TaskDocument, type TaskOperations} from '../../types'

/**
 * @beta
 * @hidden
 */
export interface TasksContextValue {
  activeDocumentId?: string
  data: TaskDocument[]
  isOpen: boolean
  isLoading: boolean
  toggleOpen: () => void
  setActiveDocumentId: (id: string | undefined) => void
  operations: TaskOperations
}
