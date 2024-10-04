import {type SanityDocumentLike} from '@sanity/types'
import {type SearchSort} from 'sanity'

export interface QueryResult {
  error: {message: string} | null
  onRetry?: () => void
  result: {documents: SanityDocumentLike[]} | null
}

export interface DocumentListPaneItem extends SanityDocumentLike {
  hasPublished: boolean
  hasDraft: boolean
  isVersion: boolean
}

export type SortOrder = {
  by: SearchSort[]
  extendedProjection?: string
}

export type LoadingVariant = 'spinner' | 'initial' | 'subtle'
