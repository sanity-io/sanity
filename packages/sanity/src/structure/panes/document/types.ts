import {type Path, type SanityDocument} from '@sanity/types'
import {type TimelineStore} from 'sanity'

import {type BaseStructureToolPaneProps} from '../types'

/** @internal */
export type TimelineMode = 'since' | 'rev' | 'closed'

/** @internal */
export type DocumentPaneProviderProps = {
  children?: React.ReactNode
  onFocusPath?: (path: Path) => void
  compareValue?: Partial<SanityDocument>
  /**
   * The perspective is normally determined by the router. The `perspectiveOverride` prop can be
   * used to explicitly set the perspective, overriding the perspective provided by the router.
   */
  perspectiveOverride?: string

  /**
   * The excluded perspective is normally determined by the router. The
   * `excludedPerspectivesOverride` prop can be used to explicitly set the excluded perspective,
   * overriding the excluded perspective provided by the router.
   */
  excludedPerspectivesOverride?: string[]
} & BaseStructureToolPaneProps<'document'>

export interface HistoryStoreProps {
  store?: TimelineStore
  error: Error | null

  // TODO: Consider removing this and using the revisionId as the indicator for it
  onOlderRevision: boolean
  revisionId: string | null
  revisionDocument: SanityDocument | null

  sinceDocument: SanityDocument | null

  ready: boolean
  /**
   * Whether this timeline is fully loaded and completely empty (true for new documents)
   * It can be `null` when the chunks hasn't loaded / is not known
   */
  isPristine: boolean

  /**
   * The id of the _rev of the last non-deleted document. TODO: Consider fetching it when necessary in  packages/sanity/src/structure/panes/document/documentPanel/banners/DeletedDocumentBanners.tsx
   */
  lastNonDeletedRevId: string | null
}
