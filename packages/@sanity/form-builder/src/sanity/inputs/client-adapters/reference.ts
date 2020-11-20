import {map, mergeMap} from 'rxjs/operators'
import client from 'part:@sanity/base/client'
import {createWeightedSearch} from 'part:@sanity/base/search/weighted'
import {observeForPreview} from 'part:@sanity/base/preview'
import {ReferenceFilterSearchOptions, ReferenceSchemaType} from '@sanity/types'

export function getPreviewSnapshot(value: {_ref: string}, referenceType: ReferenceSchemaType) {
  return observeForPreview(value, referenceType).pipe(map((result: any) => result.snapshot))
}

type SearchHit = {
  _id: string
  _type: string
}

type SearchResult = {hit: SearchHit}[]

export function search(
  textTerm: string,
  type: ReferenceSchemaType,
  options: ReferenceFilterSearchOptions
) {
  const searchWeighted = createWeightedSearch(type.to, client, options)
  return searchWeighted(textTerm, {includeDrafts: false}).pipe(
    map((results: SearchResult): SearchHit[] => results.map(({hit}) => hit))
  )
}
