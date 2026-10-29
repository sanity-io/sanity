import {type Path, type SanityDocument} from '@sanity/types'
import {type TimelineStore} from 'sanity'

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
  /**
   * @deprecated Use the events API instead. The legacy document timeline will be removed in the next major version.
   */
  // oxlint-disable-next-line no-deprecated -- part of the deprecated legacy document timeline
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
