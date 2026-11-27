import {type ComponentType} from 'react'

import {type ReferenceFilterOptions} from '../reference/types'
import {type PreviewConfig} from '../schema/preview'
import {type ObjectSchemaType} from '../schema/types'

/**
 * The stored value of a cross-dataset reference: the `_ref` document ID plus the `_dataset` and
 * `_projectId` the document lives in.
 *
 * @public
 */
export interface CrossDatasetReferenceValue {
  _type: string
  _dataset: string
  _projectId: string
  _ref: string
  _key?: string
  _weak?: boolean
}

/**
 * A document type a cross-dataset reference can point to, with the title, icon and preview
 * configuration used to display the referenced document.
 *
 * @public
 */
export interface CrossDatasetType {
  type: string
  title?: string
  icon: ComponentType
  preview: PreviewConfig
}

/**
 * The schema type of a cross-dataset reference field. Its `to` array lists the
 * {@link CrossDatasetType | types} it can reference in the given `dataset`.
 *
 * @public
 */
export interface CrossDatasetReferenceSchemaType extends Omit<ObjectSchemaType, 'options'> {
  jsonType: 'object'
  to: CrossDatasetType[]
  dataset: string
  studioUrl?: (document: {id: string; type?: string}) => string | null
  weak?: boolean
  options?: ReferenceFilterOptions
}
