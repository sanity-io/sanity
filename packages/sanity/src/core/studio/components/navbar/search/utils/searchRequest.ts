import {dequal} from 'dequal/lite'

import {isEqualSearchTerms} from '../../../../../search/common/isEqualSearchTerms'
import {type SearchOptions, type SearchTerms} from '../../../../../search/common/types'

export interface SearchRequest {
  debounceTime?: number
  options?: SearchOptions
  terms: SearchTerms
}

export function sanitizeSearchRequest(request: SearchRequest): SearchRequest {
  return {
    ...request,
    terms: {
      ...request.terms,
      filter: request.terms.filter?.trim(),
      query: request.terms.query.trim(),
    },
  }
}

export function isEqualSearchRequest(a: SearchRequest | null, b: SearchRequest | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  const {terms: aTerms, ...aRest} = a
  const {terms: bTerms, ...bRest} = b
  return isEqualSearchTerms(aTerms, bTerms) && dequal(aRest, bRest)
}
