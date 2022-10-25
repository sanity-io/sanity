// eslint-disable-next-line @typescript-eslint/no-empty-interface
import {ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition} from './common'
import {StringOptions, StringRule} from './string'

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TextRule extends StringRule {}

/** @public */
// redefined to allow separate options for text and string as needed for extensions
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TextOptions extends StringOptions {}

/** @public */
export interface TextDefinition extends BaseSchemaDefinition {
  type: 'text'
  rows?: number
  options?: TextOptions
  placeholder?: string
  validation?: ValidationBuilder<TextRule, string>
  initialValue?: InitialValueProperty<any, string>
}
