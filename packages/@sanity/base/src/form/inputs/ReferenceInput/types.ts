import {Observable} from 'rxjs'
import React, {ReactNode} from 'react'
import {Path, PreviewValue, Reference, ReferenceSchemaType} from '@sanity/types'
import {DocumentAvailability} from '../../../preview'
import {ObjectInputProps} from '../../types'

export interface ReferenceInfo {
  id: string
  type: string | undefined
  availability: DocumentAvailability
  preview: {
    draft: (PreviewValue & {_id: string; _createdAt?: string; _updatedAt?: string}) | undefined
    published: (PreviewValue & {_id: string; _createdAt?: string; _updatedAt?: string}) | undefined
  }
}

export interface ReferenceTemplate {
  id: string
  params?: Record<string, string | number | boolean>
}

export interface EditReferenceEvent {
  id: string
  type: string
  template: ReferenceTemplate
}

export interface CreateReferenceOption {
  id: string
  title: string
  icon?: React.ReactNode | React.ComponentType
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
  editReferenceLinkComponent: React.ComponentType<{
    children: React.ReactNode
    documentId: string
    documentType: string
    parentRefPath: Path
  }>

  onEditReference: (event: EditReferenceEvent) => void
  getReferenceInfo: (id: string, type: ReferenceSchemaType) => Observable<ReferenceInfo>
}
