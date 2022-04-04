import {Observable} from 'rxjs'
import {
  // CrossDatasetReference,
  // CrossDatasetReferenceSchemaType,
  // ValidationMarker,
  // Path,
  PreviewValue,
} from '@sanity/types'
import {DocumentAvailability} from '../../../preview'
// import {FormFieldPresence} from '@sanity/base/presence'
// import PatchEvent from '../../PatchEvent'

export interface CrossDatasetReferenceInfo {
  id: string
  type: string | undefined
  availability: DocumentAvailability | null
  preview: {
    published: DocumentPreview | undefined
  }
}

export type ReferenceParams = Record<string, string | number | boolean>

export type DocumentPreview = PreviewValue

export interface SearchState {
  hits: SearchHit[]
  searchString?: string
  isLoading: boolean
}

export type SearchFunction = (query: string) => Observable<SearchHit[]>

export interface SearchHit {
  id: string
  type: string
  published: undefined | {_id: string; _type: string}
}

// export interface BaseInputProps {
//   type: CrossDatasetReferenceSchemaType
//   markers: Marker[]
//   id?: string
//   focusPath: Path
//   readOnly?: boolean
//   onSearch: SearchFunction
//   compareValue?: CrossDatasetReference
//   onFocus?: (path: Path) => void
//   onBlur?: () => void
//   getReferenceInfo: (
//     doc: {_id: string; _type?: string},
//     type: CrossDatasetReferenceSchemaType
//   ) => Observable<CrossDatasetReferenceInfo>
//   onChange: (event: PatchEvent) => void
//   level: number
//   presence: FormFieldPresence[]
// }
