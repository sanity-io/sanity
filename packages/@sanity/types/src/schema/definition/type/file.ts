import {type AssetSource} from '../../../assets/types'
import {type Reference} from '../../../reference/types'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
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
