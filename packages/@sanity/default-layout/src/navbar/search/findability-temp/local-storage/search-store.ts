import type {SearchParams} from '@sanity/base'
import {SchemaType} from '@sanity/types'

const SEARCH_TERMS_KEY = 'search-terms:recent'
const MAX_RECENT_SEARCHES = 5
// might come in handy in the future
const CURRENT_VERSION = 1

interface StoredSearchTerm {
  created: Date
  term: Omit<SearchParams, 'schemas'> & {schemaNames: string[]}
}

interface StoredSearchTerms {
  version: number
  recentSearches: StoredSearchTerm[]
}

function getRecentStoredSearchTerms(): StoredSearchTerms {
  const recentString = localStorage.getItem(SEARCH_TERMS_KEY)
  return recentString
    ? (JSON.parse(recentString) as StoredSearchTerms)
    : {version: CURRENT_VERSION, recentSearches: []}
}

export function getRecentSearchTerms(schema: {
  get: (typeName: string) => SchemaType | undefined
}): SearchParams[] {
  return getRecentStoredSearchTerms().recentSearches.map((r) => ({
    query: r.term.query,
    schemas: r.term.schemaNames.map((n) => schema.get(n)).filter((s): s is SchemaType => !!s),
  }))
}

export function addSearchTerm(searchTerm: SearchParams): void {
  const saveTerm: StoredSearchTerm = {
    created: new Date(),
    term: {
      query: searchTerm.query,
      schemaNames: searchTerm.schemas.map((s) => s.name),
    },
  }
  const comparator = JSON.stringify(saveTerm.term)
  const newRecent: StoredSearchTerms = {
    version: CURRENT_VERSION,
    recentSearches: [
      saveTerm,
      ...getRecentStoredSearchTerms().recentSearches.filter(
        (r) => JSON.stringify(r.term) !== comparator
      ),
    ].slice(0, MAX_RECENT_SEARCHES),
  }
  localStorage.setItem(SEARCH_TERMS_KEY, JSON.stringify(newRecent))
}
