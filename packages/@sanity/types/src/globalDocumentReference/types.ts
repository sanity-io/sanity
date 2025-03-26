import {type ComponentType} from 'react'

import {type SanityDocument} from '../documents'
import {type Path} from '../paths'
import {type ReferenceFilterOptions} from '../reference'
import {type ObjectSchemaType, type PreviewConfig} from '../schema'

/** @beta */
export interface GlobalDocumentReferenceValue {
  _type: string
  /** The reference to the document. This is a string of the form `a:b:c`,
   * where:
   * - `a` is the resource type, for example `dataset` or `media-library`
   * - `b` is the resource ID, for example data set name or media library ID
   * - `c` is the document ID */
  _ref: `${string}:${string}:${string}`
  _key?: string
  _weak?: boolean
}

/** @beta */
export interface WeakGlobalDocumentReferenceValue extends GlobalDocumentReferenceValue {
  _weak: true
}

/** @beta */
export type GlobalDocumentReferenceFilterSearchOptions = {
  filter?: string
  params?: Record<string, unknown>
  tag?: string
}

/** @beta */
export type GlobalDocumentReferenceFilterResolver = (options: {
  document: SanityDocument
  parent?: Record<string, unknown> | Record<string, unknown>[]
  parentPath: Path
}) =>
  | GlobalDocumentReferenceFilterSearchOptions
  | Promise<GlobalDocumentReferenceFilterSearchOptions>

/** @beta */
export interface GlobalDocumentReferenceType {
  type: string
  title?: string
  icon: ComponentType
  preview: PreviewConfig
  /** @deprecated Unused. It's only here for the type to be compatible with createSearchQuery.ts */
  __experimental_search: never
}

/** @beta */
export interface GlobalDocumentReferenceSchemaType extends Omit<ObjectSchemaType, 'options'> {
  jsonType: 'object'
  to: GlobalDocumentReferenceType[]
  resourceType: string
  resourceId: string
  studioUrl?: (document: {id: string; type?: string}) => string | null
  weak?: boolean
  options?: ReferenceFilterOptions
}
