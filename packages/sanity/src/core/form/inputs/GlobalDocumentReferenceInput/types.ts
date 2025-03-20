import {type PreviewValue} from '@sanity/types'
import {type Observable} from 'rxjs'

import {type DocumentAvailability} from '../../../preview'

/** @internal */
export interface GlobalDocumentReferenceInfo {
  id: string
  type: string | undefined
  availability: DocumentAvailability | null
  preview: {
    published: PreviewValue | undefined
  }
}

/** @internal */
export interface SearchState {
  hits: SearchHit[]
  searchString?: string
  isLoading: boolean
}

/** @internal */
export type GlobalDocumentSearchFunction = (query: string) => Observable<SearchHit[]>

/** @internal */
export interface SearchHit {
  id: string
  type: string
  published: undefined | {_id: string; _type: string}
}
