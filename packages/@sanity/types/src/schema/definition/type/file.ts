import {type SanityClient, type StackablePerspective} from '@sanity/client'

import {type AssetSource} from '../../../assets/types'
import {type SanityDocument} from '../../../documents/types'
import {type Path} from '../../../paths/types'
import {type Reference} from '../../../reference/types'
import {type CurrentUser} from '../../../user/types'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type FileSchemaType, type ImageSchemaType, type InitialValueProperty} from '../../types'
import {type ObjectDefinition, type ObjectOptions} from './object'

/** @public */
export interface MediaLibraryFilter {
  name: string
  query: string
}

/** @public */
export interface MediaLibraryOptions {
  filters?: MediaLibraryFilter[]
}

/**
 * Context passed to resolver functions on `options.mediaLibrary` (and the matching
 * `mediaLibrary` Studio config). Mirrors `ReferenceFilterResolverContext` and adds the
 * current user and Media Library details.
 * @public
 */
export interface MediaLibraryResolverContext {
  /** The document being edited (the form's root value). */
  document: SanityDocument
  /** The value containing the asset field (an object, or the array for array items). */
  parent?: Record<string, unknown> | Record<string, unknown>[]
  /** Path to `parent` within the document. */
  parentPath: Path
  /** The perspective stack the Studio is editing with. */
  perspective: StackablePerspective[]
  /** Project-scoped client factory, same as `ReferenceFilterResolverContext.getClient`. */
  getClient: (options: {apiVersion: string}) => SanityClient
  /** The signed-in user, or null before the user has loaded. */
  currentUser: CurrentUser | null
  /** The image or file schema type the asset source was opened for. */
  schemaType: ImageSchemaType | FileSchemaType
  /** The Media Library the Studio is connected to. */
  libraryId: string
  /** Client scoped to the Media Library resource (query `sanity.directory`, `sanity.asset.collection`, ...). */
  getMediaLibraryClient: (options: {apiVersion: string}) => SanityClient
}

/**
 * A static value or a function (sync or async) resolving it from {@link MediaLibraryResolverContext}.
 * Returning `undefined` means "not configured here".
 * @public
 */
export type MediaLibraryResolver<T> = (context: MediaLibraryResolverContext) => T | Promise<T>

/**
 * Per-field selection of asset sources (`options.sources` on file and image
 * fields; video fields always use the built-in Media Library source). When
 * set, it replaces the asset sources configured on the Studio for this field:
 *
 * - `AssetSource` entries are used as-is (the classic pattern of importing a
 *   source from a plugin).
 * - `string` entries name a configured source by its `AssetSource.name`
 *   (e.g. `'sanity-default'`, `'sanity-media-library'`); names that match no
 *   configured source are dropped with a console warning.
 * - A predicate function filters the configured list. Useful when the full
 *   name is not statically known — federated asset source names are
 *   `{applicationId}:{viewName}` with a runtime application id, so e.g.
 *   `(source) => source.name.endsWith(':dropbox')`.
 *
 * An empty array (or a predicate that rejects every source) disables
 * browsing for the field while uploads keep working.
 *
 * @public
 */
export type SchemaAssetSources = (AssetSource | string)[] | ((source: AssetSource) => boolean)

/** @public */
export interface FileOptions extends ObjectOptions {
  storeOriginalFilename?: boolean
  accept?: string
  sources?: SchemaAssetSources
  mediaLibrary?: MediaLibraryOptions
  /**
   * When set to `true`, hides the upload UI, only allowing selection of existing assets from the media library.
   * Useful for centralized asset management workflows where ad-hoc uploads should be prevented.
   */
  disableNew?: boolean
}

/** @public */
export interface FileRule extends RuleDef<FileRule, FileValue> {
  /**
   * Require a file field has an asset.
   *
   * @example
   * ```ts
   * defineField({
   *  name: 'file',
   *  title: 'File',
   *  type: 'file',
   *  validation: (Rule) => Rule.required().assetRequired(),
   * })
   * ```
   */
  assetRequired(): FileRule
}

/** @public */
export interface FileValue {
  asset?: Reference
  [index: string]: unknown
}

/** @public */
export interface FileDefinition extends Omit<
  ObjectDefinition,
  'type' | 'fields' | 'options' | 'groups' | 'validation'
> {
  type: 'file'
  fields?: ObjectDefinition['fields']
  options?: FileOptions
  validation?: ValidationBuilder<FileRule, FileValue>
  initialValue?: InitialValueProperty<any, FileValue>
}
