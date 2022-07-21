import type {SearchTerms} from '@sanity/base'
import {ObjectSchemaType, SchemaType} from '@sanity/types'

const SEARCH_TERMS_KEY = 'search-terms:recent'
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

function getRecentStoredSearchTerms(): StoredSearchTerms {
  const recentString = window.localStorage.getItem(SEARCH_TERMS_KEY)
  return recentString
    ? (JSON.parse(recentString) as StoredSearchTerms)
    : {version: CURRENT_VERSION, recentSearches: []}
}

export function getRecentSearchTerms(schema: {
  get: (typeName: string) => SchemaType | undefined
}): RecentSearch[] {
  return getRecentStoredSearchTerms()
    .recentSearches.filter((r) => !!r.terms)
    .map((r) => ({
      __recentTimestamp: new Date(r.created).getTime(),
      query: r.terms.query,
      types: r.terms.typeNames
        .map((typeName) => schema.get(typeName))
        .filter((s): s is ObjectSchemaType => s && s.jsonType === 'object'),
    }))
}

export function addSearchTerm(searchTerm: SearchTerms): void {
  const saveTerm: StoredSearchTerm = {
    created: new Date().toISOString(),
    terms: {
      query: searchTerm.query,
      typeNames: searchTerm.types.map((s) => s.name),
    },
  }
  const comparator = JSON.stringify(saveTerm.terms)
  const newRecent: StoredSearchTerms = {
    version: CURRENT_VERSION,
    recentSearches: [
      saveTerm,
      ...getRecentStoredSearchTerms().recentSearches.filter((r) => {
        return JSON.stringify(r.terms) !== comparator
      }),
    ].slice(0, MAX_RECENT_SEARCHES),
  }
  window.localStorage.setItem(SEARCH_TERMS_KEY, JSON.stringify(newRecent))
}
