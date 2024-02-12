import {TaskDocument, TaskOperations} from '../../types'

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
  data: TaskDocument[]
  isOpen: boolean
  isLoading: boolean
  toggleOpen: () => void
  setActiveDocumentId: (id: string | undefined) => void
  operations: TaskOperations
}
