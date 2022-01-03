import {BaseDeskToolPaneProps} from '../types'

export type TimelineMode = 'since' | 'rev' | 'closed'

export type DocumentPaneProviderProps = {
  children?: React.ReactNode
} & BaseDeskToolPaneProps<'document'>
