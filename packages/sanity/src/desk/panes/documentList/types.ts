import {SanityDocument} from '@sanity/types'
import type {SearchSort} from 'sanity'

export interface DocumentListPaneItem extends SanityDocument {
  hasPublished: boolean
  hasDraft: boolean
}

export type SortOrder = {
  by: SearchSort[]
  extendedProjection?: string
}

export interface QueryResult {
  error: {message: string} | null
  onRetry?: (event: unknown) => void
  result: {documents: SanityDocument[]} | null
}

export type LoadingVariant = 'spinner' | 'initial'
