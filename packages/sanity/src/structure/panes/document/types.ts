import {type Path, type SanityDocument} from '@sanity/types'
import {type TimelineStore} from 'sanity'

import {type BaseStructureToolPaneProps} from '../types'

/** @internal */
export type DocumentPaneProviderProps = {
  children?: React.ReactNode
  onFocusPath?: (path: Path) => void
} & BaseStructureToolPaneProps<'document'>

/** @internal */
export interface HistoryStoreProps {
  store?: TimelineStore
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
