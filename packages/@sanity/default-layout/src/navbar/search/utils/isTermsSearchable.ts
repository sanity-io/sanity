import type {SearchTerms} from '@sanity/base'

export function isTermsSearchable(terms: SearchTerms): boolean {
  return terms.query !== '' || !!terms.types.length
}
