import {AssetSource} from '../../../assets'
import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {ObjectDefinition, ObjectOptions} from './object'

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
  asset?: {
    _type?: 'reference'
    _ref?: string
  }
  [index: string]: unknown
}

/** @public */
export interface FileDefinition extends Omit<ObjectDefinition, 'type' | 'fields' | 'options'> {
  type: 'file'
  fields?: ObjectDefinition['fields']
  options?: FileOptions
  validation?: ValidationBuilder<FileRule>
  initialValue?: InitialValueProperty<any, FileValue>
}
