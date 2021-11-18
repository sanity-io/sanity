import {Observable} from 'rxjs'
import React, {ReactNode} from 'react'
import {
  Marker,
  ObjectSchemaType,
  Path,
  PreviewValue,
  Reference,
  ReferenceSchemaType,
} from '@sanity/types'
import {DocumentAvailability} from '@sanity/base/_internal'
import {FormFieldPresence} from '@sanity/base/presence'
import PatchEvent from '../../PatchEvent'

export interface ReferenceInfo {
  id: string
  type: string | undefined
  availability: DocumentAvailability
  preview: {
    draft: DocumentPreview | undefined
    published: DocumentPreview | undefined
  }
}

export interface DocumentPreview extends PreviewValue {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
}

export interface SearchState {
  hits: SearchHit[]
  isLoading: boolean
}

export type SearchFunction = (query: string) => Observable<SearchHit[]>

// used to preview both the current value and autocomplete hits
export type PreviewComponentType = React.ComponentType<{
  referenceInfo?: ReferenceInfo
  refType?: ObjectSchemaType

  showTypeLabel: boolean
  // this provides us with a workaround for an issue with styled-components that
  // forces us to write a data-selected prop on the <TextWithTone> component
  // When this is fixed, removing this prop should just work
  // It's likely tied to this issue in the downstream styled-components dependency Stylis.js: https://github.com/thysultan/stylis.js/issues/272
  // eslint-disable-next-line camelcase
  __workaround_selected?: boolean
}>

export interface SearchHit {
  id: string
  type: string
  draft: undefined | {_id: string; _type: string}
  published: undefined | {_id: string; _type: string}
}

export interface BaseInputProps {
  value?: Reference
  type: ReferenceSchemaType
  markers: Marker[]
  id?: string
  suffix?: ReactNode
  focusPath: Path
  readOnly?: boolean
  onSearch: SearchFunction
  compareValue?: Reference
  onFocus?: (path: Path) => void
  onBlur?: () => void
  selectedState?: 'selected' | 'pressed' | 'none'
  editReferenceLinkComponent: React.ComponentType
  onEditReference: (id: string, type: ObjectSchemaType) => void
  getReferenceInfo: (id: string, type: ReferenceSchemaType) => Observable<ReferenceInfo>
  previewComponent: PreviewComponentType
  onChange: (event: PatchEvent) => void
  level: number
  presence: FormFieldPresence[]
}
