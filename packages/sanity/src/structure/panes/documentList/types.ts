import {type SanityDocumentLike} from '@sanity/types'
import {type SearchSort} from 'sanity'

export interface DocumentListPaneItem extends SanityDocumentLike {
  hasPublished: boolean
  hasDraft: boolean
}

export type SortOrder = {
  by: SearchSort[]
}

/**
 * Serializable subset of `SearchSort`.
 */
export type StaticSearchSort = Pick<SearchSort, 'field' | 'direction' | 'mapWith' | 'nulls'>

/**
 * Serializable subset of `SortOrder`.
 */
export type StaticSortOrder = {
  by: StaticSearchSort[]
}

export type LoadingVariant = 'spinner' | 'initial' | 'subtle'
