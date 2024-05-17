import {type TaskDocument} from '../../types'

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
}
