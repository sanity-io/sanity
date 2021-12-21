import {DocumentBuilder} from '@sanity/structure'
import {UnresolvedPaneNode} from '../../types'

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
  features: DeskToolFeatures
  layoutCollapsed: boolean
  resolveDocumentNode: (options: {documentId?: string; schemaType: string}) => DocumentBuilder
  structure: UnresolvedPaneNode
}
