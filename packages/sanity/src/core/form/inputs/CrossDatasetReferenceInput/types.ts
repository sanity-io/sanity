import {PreviewValue} from '@sanity/types'
import {Observable} from 'rxjs'
import {DocumentAvailability} from '../../../preview'

export interface CrossDatasetReferenceInfo {
  id: string
  type: string | undefined
  availability: DocumentAvailability | null
  preview: {
    published: PreviewValue | undefined
  }
}

export interface SearchState {
  hits: CrossDatasetSearchHit[]
  searchString?: string
  isLoading: boolean
}

export type CrossDatasetSearchFunction = (query: string) => Observable<CrossDatasetSearchHit[]>

export interface CrossDatasetSearchHit {
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
