import type {SearchTerms} from '@sanity/base'
import {ObjectSchemaType, SchemaType} from '@sanity/types'
import {versionedClient} from '../../../versionedClient'

const SEARCH_TERMS_KEY = 'search-terms::recent'
export const MAX_RECENT_SEARCHES = 5
// might come in handy in the future
const CURRENT_VERSION = 1

export type RecentSearch = SearchTerms & {__recentTimestamp: number}

interface StoredSearchTerm {
  created: string
  terms: Omit<SearchTerms, 'types'> & {typeNames: string[]}
}

interface StoredSearchTerms {
  version: number
  recentSearches: StoredSearchTerm[]
}

const {projectId, dataset} = versionedClient.config()

function getLSKey(userId: string) {
  return `${SEARCH_TERMS_KEY}__${projectId}:${dataset}:${userId}`
}

function getRecentStoredSearchTerms(userId: string): StoredSearchTerms {
  const recentString = supportsLocalStorage
    ? window.localStorage.getItem(getLSKey(userId))
    : undefined

  return recentString
    ? (JSON.parse(recentString) as StoredSearchTerms)
    : {version: CURRENT_VERSION, recentSearches: []}
}

export function getRecentSearchTerms(
  schema: {
    get: (typeName: string) => SchemaType | undefined
  },
  userId: string
): RecentSearch[] {
  return getRecentStoredSearchTerms(userId)
    .recentSearches.filter((r) => !!r.terms)
    .map((r) => ({
      __recentTimestamp: new Date(r.created).getTime(),
      query: r.terms.query,
      types: r.terms.typeNames
        .map((typeName) => schema.get(typeName))
        .filter((s): s is ObjectSchemaType => s && s.jsonType === 'object'),
    }))
}

export function addSearchTerm(searchTerm: SearchTerms, userId: string): void {
  if (!supportsLocalStorage) {
    return
  }

  const saveTerm: StoredSearchTerm = {
    created: new Date().toISOString(),
    terms: {
      query: searchTerm.query.trim(),
      typeNames: searchTerm.types.map((s) => s.name),
    },
  }
  const comparator = JSON.stringify(saveTerm.terms)
  const newRecent: StoredSearchTerms = {
    version: CURRENT_VERSION,
    recentSearches: [
      saveTerm,
      ...getRecentStoredSearchTerms(userId).recentSearches.filter((r) => {
        return JSON.stringify(r.terms) !== comparator
      }),
    ].slice(0, MAX_RECENT_SEARCHES),
  }
  window.localStorage.setItem(getLSKey(userId), JSON.stringify(newRecent))
}

export function removeSearchTerms(userId: string): void {
  if (!supportsLocalStorage) {
    return
  }

  const searchTerms = getRecentStoredSearchTerms(userId)

  const newRecent: StoredSearchTerms = {
    ...searchTerms,
    recentSearches: [],
  }

  window.localStorage.setItem(getLSKey(userId), JSON.stringify(newRecent))
}

export function removeSearchTermAtIndex(index: number, userId: string): void {
  if (!supportsLocalStorage) {
    return
  }

  const searchTerms = getRecentStoredSearchTerms(userId)

  if (index < 0 || index > searchTerms.recentSearches.length) {
    return
  }

  const newRecent: StoredSearchTerms = {
    ...searchTerms,
    recentSearches: [
      ...searchTerms.recentSearches.slice(0, index),
      ...searchTerms.recentSearches.slice(index + 1),
    ],
  }

  window.localStorage.setItem(getLSKey(userId), JSON.stringify(newRecent))
}

const supportsLocalStorage = (() => {
  const key = '__tmp__can_use'
  try {
    if (typeof localStorage === 'undefined') {
      return false
    }

    localStorage.setItem(key, '---')
    localStorage.removeItem(key)
    return true
  } catch (err) {
    return false
  }
})()
