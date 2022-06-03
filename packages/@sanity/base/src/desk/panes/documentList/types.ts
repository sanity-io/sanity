import {SanityDocument} from '@sanity/types'

export interface DocumentListPaneItem extends SanityDocument {
  hasPublished: boolean
  hasDraft: boolean
}

export type SortOrderBy = {field: string; direction: 'asc' | 'desc'; mapWith?: string}

export type SortOrder = {
  by: SortOrderBy[]
  extendedProjection?: string[]
}

export interface QueryResult {
  error: {message: string} | false
  loading?: boolean
  onRetry?: (event: unknown) => void
  result: {documents: SanityDocument[]} | null
}
