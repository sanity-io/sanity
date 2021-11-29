// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {SanityDocument} from '@sanity/types'
import {collate, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import type {DocumentListPaneItem, SortOrderBy} from './types'

export function getDocumentKey(value: DocumentListPaneItem, index: number): string {
  return value._id ? getPublishedId(value._id) : `item-${index}`
}

export function removePublishedWithDrafts(documents: SanityDocument[]): DocumentListPaneItem[] {
  return collate(documents).map((entry) => {
    const doc = entry.draft || entry.published
    return {
      ...doc,
      hasPublished: !!entry.published,
      hasDraft: !!entry.draft,
    }
  })
}

// export function getDocumentKey(document: DocumentListPaneItem): string {
//   return getPublishedId(document._id)
// }

const RE_TYPE_NAME_IN_FILTER = /\b_type\s*==\s*(['"].*?['"]|\$.*?(?:\s|$))|\B(['"].*?['"]|\$.*?(?:\s|$))\s*==\s*_type\b/
export function getTypeNameFromSingleTypeFilter(
  filter: string,
  params: Record<string, unknown> = {}
): string | null {
  const matches = filter.match(RE_TYPE_NAME_IN_FILTER)

  if (!matches) {
    return null
  }

  const match = (matches[1] || matches[2]).trim().replace(/^["']|["']$/g, '')

  if (match[0] === '$') {
    const k = match.slice(1)
    const v = params[k]

    return typeof v === 'string' ? v : null
  }

  return match
}

export function isSimpleTypeFilter(filter: string): boolean {
  return /^_type\s*==\s*['"$]\w+['"]?\s*$/.test(filter.trim())
}

export function toOrderClause(orderBy: SortOrderBy[]): string {
  return orderBy
    .map((ordering) =>
      [ordering.field, (ordering.direction || '').toLowerCase()]
        .map((str) => str.trim())
        .filter(Boolean)
        .join(' ')
    )
    .join(',')
}
