import type {SanityDocument} from '@sanity/types'

export interface DocumentListPaneItem extends SanityDocument {
  hasPublished: boolean
  hasDraft: boolean
}

export type Layout = 'default' | 'detail' | 'card' | 'media'

export type SortOrderBy = {field: string; direction: 'asc' | 'desc'}

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
