import {type SanityDocumentLike} from '@sanity/types'
import {type SearchSort} from 'sanity'

export interface DocumentListPaneItem extends SanityDocumentLike {
  hasPublished: boolean
  hasDraft: boolean
}

export type SortOrder = {
  by: SearchSort[]
  extendedProjection?: string
}

export type LoadingVariant = 'spinner' | 'initial' | 'subtle'
