import {type ClientPerspective, type SanityClient, type StackablePerspective} from '@sanity/client'

import {type SanityDocument} from '../documents'
import {type Path} from '../paths'
import {type BaseSchemaTypeOptions} from '../schema'
import {type SearchStrategy} from '../search/types'

/** @public */
export interface Reference {
  _type: string
  _ref: string
  _key?: string
  _weak?: boolean
  _strengthenOnPublish?: {
    type: string
    weak?: boolean
    template?: {id: string; params: Record<string, string | number | boolean>}
  }
}

/** @internal */
export interface WeakReference extends Reference {
  _weak: true
}

/** @public */
export type ReferenceFilterSearchOptions = {
  filter?: string
  params?: Record<string, unknown>
  tag?: string
  maxFieldDepth?: number
  strategy?: SearchStrategy
  perspective?: Exclude<ClientPerspective, 'raw' | 'previewDrafts'>
}

/** @public */
export interface ReferenceFilterResolverContext {
  document: SanityDocument
  parent?: Record<string, unknown> | Record<string, unknown>[]
  parentPath: Path
  perspective: StackablePerspective[]
  getClient: (options: {apiVersion: string}) => SanityClient
}

/** @public */
export type ReferenceFilterResolver = (
  context: ReferenceFilterResolverContext,
) => ReferenceFilterSearchOptions | Promise<ReferenceFilterSearchOptions>

/** @public */
export interface ReferenceTypeOption {
  type: string
}

/**
 * Context object passed to the creationTypeFilter callback.
 *
 * @public
 */
export interface ReferenceTypeFilterContext {
  /** The current document being edited */
  document: SanityDocument
  /** The parent value containing this reference field */
  parent?: Record<string, unknown> | Record<string, unknown>[]
  /** The path to the parent value in the document */
  parentPath: Path
}

/**
 * Function type for filtering which document types can be created from a reference field.
 *
 * The `creationTypeFilter` specifically controls the types
 * available when clicking "Create new" in the reference input.
 *
 * This is distinct from the `filter` option, which controls which existing documents appear in search results.
 *
 * @param context - Information about the current document and field location
 * @param toTypes - Array of type options from the reference field's `to` configuration
 * @returns Filtered array of type options that should be available for creation
 *
 * @public
 */
export type ReferenceTypeFilter = (
  context: ReferenceTypeFilterContext,
  toTypes: ReferenceTypeOption[],
) => ReferenceTypeOption[]

/** @public */
export interface ReferenceFilterResolverOptions {
  filter?: ReferenceFilterResolver
  filterParams?: never
}

/** @public */
export interface ReferenceFilterQueryOptions {
  filter: string
  filterParams?: Record<string, unknown>
}

/** @public */
export interface ReferenceBaseOptions extends BaseSchemaTypeOptions {
  /**
   * When `true`, hides the "Create new" button in the reference input,
   * preventing users from creating new documents from this field.
   *
   * For more granular control (e.g., allowing creation of only specific types,
   * or conditionally hiding the button based on document state), use the
   * `creationTypeFilter` option instead.
   */
  disableNew?: boolean
  /**
   * Callback function to dynamically filter which document types can be created
   * from this reference field based on the current document state.
   *
   * This allows you to conditionally restrict the types available in the
   * "Create new" dropdown based on other field values in the document.
   *
   * **Important**: This only affects document creation, not which existing documents
   * appear in search results. To filter search results, use the `filter` option instead.
   *
   * @param context - Contains the current document, parent value, and field path
   * @param toTypes - Array of all types configured in the reference field's `to` property
   * @returns Array of type options that should be available for creation. Return the
   *          original `toTypes` array to allow all types, a filtered subset to restrict
   *          available types, or an empty array `[]` to hide the "Create new" button entirely.
   */
  creationTypeFilter?: ReferenceTypeFilter
}

/** @public */
export type ReferenceFilterOptions = ReferenceFilterResolverOptions | ReferenceFilterQueryOptions
