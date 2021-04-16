import {map} from 'rxjs/operators'
import {ReferenceFilterSearchOptions, ReferenceSchemaType} from '@sanity/types'
import {Observable} from 'rxjs'
import {createWeightedSearch, observeForPreview} from '../../../legacyParts'
import {versionedClient} from '../../versionedClient'

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
): Observable<SearchHit[]> {
  const searchWeighted = createWeightedSearch(type.to, versionedClient, options)
  return searchWeighted(textTerm, {includeDrafts: false}).pipe(
    map((results: SearchResult): SearchHit[] =>
      results.map(({hit}) => ({_type: hit._type, _id: hit._id}))
    )
  )
}
