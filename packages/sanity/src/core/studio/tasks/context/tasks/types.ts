import {TaskDocument} from '../../types'

export interface TasksContextValue {
  isOpen: boolean
  data: TaskDocument[] | null
  isLoading: boolean
  toggleOpen: () => void
}
