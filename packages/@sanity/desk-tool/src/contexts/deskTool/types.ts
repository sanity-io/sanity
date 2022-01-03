import {SchemaType} from '@sanity/types'
import {DocumentActionsResolver, UnresolvedPaneNode} from '../../types'

/**
 * @internal
 */
export interface DeskToolFeatures {
  /**
   * @beta
   */
  backButton: boolean
  reviewChanges: boolean
  splitPanes: boolean
  splitViews: boolean
}

/**
 * @internal
 */
export interface DeskToolContextValue {
  components: {LanguageFilter?: React.ComponentType<{schemaType: SchemaType}>}
  features: DeskToolFeatures
  layoutCollapsed: boolean
  resolveDocumentActions: DocumentActionsResolver
  structure: UnresolvedPaneNode
}
