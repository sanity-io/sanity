import type {ComponentType} from 'react'
import type {Path} from '../paths'
import type {SanityDocument} from '../documents'
import type {ObjectSchemaType, PreviewConfig} from '../schema'
import type {ReferenceFilterOptions} from '../reference'

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
export interface WeakCrossDatasetReferenceValue extends CrossDatasetReferenceValue {
  _weak: true
}

/** @beta */
export type CrossDatasetReferenceFilterSearchOptions = {
  filter?: string
  params?: Record<string, unknown>
  tag?: string
}

/** @beta */
export type CrossDatasetReferenceFilterResolver = (options: {
  document: SanityDocument
  parent?: Record<string, unknown> | Record<string, unknown>[]
  parentPath: Path
}) => CrossDatasetReferenceFilterSearchOptions | Promise<CrossDatasetReferenceFilterSearchOptions>

/** @beta */
export interface CrossDatasetType {
  type: string
  title?: string
  icon: ComponentType
  preview: PreviewConfig
  /** @alpha */
  __experimental_search: ObjectSchemaType['__experimental_search']
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
