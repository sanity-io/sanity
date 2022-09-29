import {PreviewValue} from '@sanity/types'
import {Observable} from 'rxjs'
import {DocumentAvailability} from '../../../preview'

/** @internal */
export interface CrossDatasetReferenceInfo {
  id: string
  type: string | undefined
  availability: DocumentAvailability | null
  preview: {
    published: PreviewValue | undefined
  }
}

/** @internal */
export interface SearchState {
  hits: CrossDatasetSearchHit[]
  searchString?: string
  isLoading: boolean
}

/** @internal */
export type CrossDatasetSearchFunction = (query: string) => Observable<CrossDatasetSearchHit[]>

/** @internal */
export interface CrossDatasetSearchHit {
  id: string
  type: string
  published: undefined | {_id: string; _type: string}
}
