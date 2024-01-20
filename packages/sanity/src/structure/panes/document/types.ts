import {type Path} from '@sanity/types'

import {type BaseStructureToolPaneProps} from '../types'

/** @internal */
export type TimelineMode = 'since' | 'rev' | 'closed'

/** @internal */
export type DocumentPaneProviderProps = {
  children?: React.ReactNode
  onFocusPath?: (path: Path) => void
} & BaseStructureToolPaneProps<'document'>
