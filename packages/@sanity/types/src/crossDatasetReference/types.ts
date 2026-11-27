import {type ComponentType} from 'react'

import {type ReferenceFilterOptions} from '../reference/types'
import {type PreviewConfig} from '../schema/preview'
import {type ObjectSchemaType} from '../schema/types'

/** @beta */
export interface CrossDatasetReferenceValue {
  _type: string
  _dataset: string
  _projectId: string
  _ref: string
  _key?: string
  _weak?: boolean
}

/** @beta */
export interface CrossDatasetType {
  type: string
  title?: string
  icon: ComponentType
  preview: PreviewConfig
}

/** @beta */
export interface CrossDatasetReferenceSchemaType extends Omit<ObjectSchemaType, 'options'> {
  jsonType: 'object'
  to: CrossDatasetType[]
  dataset: string
  studioUrl?: (document: {id: string; type?: string}) => string | null
  weak?: boolean
  options?: ReferenceFilterOptions
}
