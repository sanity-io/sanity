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
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FileRule extends RuleDef<FileRule, FileValue> {}

/** @public */
export interface FileValue {
  asset?: Reference
  [index: string]: unknown
}

/** @public */
export interface FileDefinition
  extends Omit<ObjectDefinition, 'type' | 'fields' | 'options' | 'groups'> {
  type: 'file'
  fields?: ObjectDefinition['fields']
  options?: FileOptions
  validation?: ValidationBuilder<FileRule>
  initialValue?: InitialValueProperty<any, FileValue>
}
