import type {AssetSource} from '../../../assets/types'
import type {Reference} from '../../../reference/types'
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

/** @public */
export interface FileOptions extends ObjectOptions {
  storeOriginalFilename?: boolean
  accept?: string
  sources?: AssetSource[]
  mediaLibrary?: MediaLibraryOptions
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
export interface FileDefinition
  extends Omit<ObjectDefinition, 'type' | 'fields' | 'options' | 'groups' | 'validation'> {
  type: 'file'
  fields?: ObjectDefinition['fields']
  options?: FileOptions
  validation?: ValidationBuilder<FileRule, FileValue>
  initialValue?: InitialValueProperty<any, FileValue>
}
