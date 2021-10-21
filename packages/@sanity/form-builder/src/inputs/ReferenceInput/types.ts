import {Observable} from 'rxjs'
import React from 'react'
import {ObjectSchemaType, PreviewValue} from '@sanity/types'
import {DocumentAvailability} from '@sanity/base/_internal'

export interface ReferenceInfo {
  id: string
  type: string | undefined
  draft: {
    availability: DocumentAvailability
    preview: DocumentPreview
  }
  published: {
    availability: DocumentAvailability
    preview: DocumentPreview
  }
}

export interface DocumentPreview extends PreviewValue {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
}

export type DocumentMetadata = {
  /**
   * null if current user doesn't have access to determine existence
   */
  exists: boolean | null
  readable: boolean
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
