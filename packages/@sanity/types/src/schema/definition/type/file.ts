import type {AssetSource} from '../../../assets'
import type {Reference} from '../../../reference'
import type {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import type {InitialValueProperty} from '../../types'
import type {ObjectDefinition, ObjectOptions} from './object'

/** @public */
export interface FileOptions extends ObjectOptions {
  storeOriginalFilename?: boolean
  accept?: string
  sources?: AssetSource[]
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
