import {TaskDocument, TaskOperations} from '../../types'

export interface TasksContextValue {
  activeDocumentId?: string
  data: TaskDocument[]
  isOpen: boolean
  isLoading: boolean
  toggleOpen: () => void
  setActiveDocumentId: (id: string | undefined) => void
  operations: TaskOperations
}
