import {type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {type BaseSchemaDefinition} from './common'
import {type StringOptions, type StringRule} from './string'

/** @public */
export interface TextRule extends StringRule {}

/** @public */
// redefined to allow separate options for text and string as needed for extensions
export interface TextOptions extends StringOptions {}

/** @public */
export interface TextDefinition extends BaseSchemaDefinition {
  type: 'text'
  rows?: number
  options?: TextOptions
  placeholder?: string
  elideIf?: string
  validation?: ValidationBuilder<TextRule, string>
  initialValue?: InitialValueProperty<any, string>
}
