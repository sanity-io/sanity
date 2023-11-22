import {Path} from '@sanity/types'
import {BaseDeskToolPaneProps} from '../types'

/** @internal */
export type TimelineMode = 'since' | 'rev' | 'closed'

/** @internal */
export type DocumentPaneProviderProps = {
  children?: React.ReactNode
  forceCloseButton?: boolean
  onFocusPath?: (path: Path) => void
} & BaseDeskToolPaneProps<'document'>
