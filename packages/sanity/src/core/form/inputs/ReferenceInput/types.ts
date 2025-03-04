import {
  type I18nTextRecord,
  type Path,
  type PreviewValue,
  type Reference,
  type ReferenceSchemaType,
} from '@sanity/types'
import {type ComponentType, type ReactNode} from 'react'
import {type Observable} from 'rxjs'

import {type ReleaseId} from '../../../perspective/types'
import {type DocumentAvailability} from '../../../preview'
import {type PreviewState} from '../../../preview/utils/getPreviewStateObservable'
import {type ObjectInputProps} from '../../types'

export type PreviewDocumentValue = PreviewValue & {
  _id: string
  _createdAt?: string
  _updatedAt?: string
}

export interface ReferenceInfo {
  id: string
  type: string | undefined
  isPublished: boolean | null
  availability: DocumentAvailability
  preview: PreviewState
}

export interface ReferenceTemplate {
  id: string
  params?: Record<string, string | number | boolean>
}

export interface EditReferenceEvent {
  id: string
  type: string
  template: ReferenceTemplate
  version?: ReleaseId
}

export interface CreateReferenceOption {
  id: string
  title: string
  i18n?: I18nTextRecord<'title'>
  icon?: ReactNode | ComponentType
  type: string
  template: ReferenceTemplate
  permission: {
    granted: boolean
    reason: string
  }
}

export interface ReferenceSearchState {
  hits: ReferenceSearchHit[]
  searchString?: string
  isLoading: boolean
}

export type ReferenceSearchFunction = (query: string) => Observable<ReferenceSearchHit[]>

export interface ReferenceSearchHit {
  id: string
  type: string
  draft?: {_id: string; _type: string}
  published?: {_id: string; _type: string}
}

export interface ReferenceInputProps<Value = Reference>
  extends ObjectInputProps<Value, ReferenceSchemaType> {
  suffix?: ReactNode
  liveEdit?: boolean
  onSearch: ReferenceSearchFunction
  selectedState?: 'selected' | 'pressed' | 'none'
  createOptions: CreateReferenceOption[]
  editReferenceLinkComponent: ComponentType<{
    children: ReactNode
    documentId: string
    documentType: string
    parentRefPath: Path
  }>

  onEditReference: (event: EditReferenceEvent) => void
  getReferenceInfo: (id: string, type: ReferenceSchemaType) => Observable<ReferenceInfo>
  version?: string
}
