import {type Path, type SanityDocument} from '@sanity/types'

import {type BaseStructureToolPaneProps} from '../types'

/** @internal */
export type DocumentPaneProviderProps = {
  children?: React.ReactNode
  onFocusPath?: (path: Path) => void
  onSetMaximizedPane?: () => void
  maximized?: boolean
} & BaseStructureToolPaneProps<'document'>

/** @internal */
export interface HistoryStoreProps {
  error: Error | null
  onOlderRevision: boolean
  revisionId: string | null
  revisionDocument: SanityDocument | null
  sinceDocument: SanityDocument | null
  ready: boolean
  /**
   * Whether this timeline is fully loaded and completely empty (true for new documents)
   */
  isPristine: boolean
  /**
   * The id of the _rev of the last non-deleted document.
   */
  lastNonDeletedRevId: string | null
}
