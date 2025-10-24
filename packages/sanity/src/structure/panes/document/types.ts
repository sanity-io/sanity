import {type Path, type SanityDocument} from '@sanity/types'
import {type TimelineStore} from 'sanity'

import {type BaseStructureToolPaneProps} from '../types'

/** @internal */
export type DocumentPaneProviderProps = {
  children?: React.ReactNode
} & BaseStructureToolPaneProps<'document'> &
  (
    | {
        controlledFocusPath: true
        /** if passed, document pane will not handle focus on its own */
        onFocusPath: (path: Path) => void
        /** if passed, document pane will not handle focus on its own */
        focusPath: Path
      }
    | {controlledFocusPath: false; focusPath: undefined; onFocusPath: undefined}
  )

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
