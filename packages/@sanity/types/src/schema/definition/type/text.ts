// eslint-disable-next-line @typescript-eslint/no-empty-interface
import {ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition} from './common'
import {StringOptions, StringRule} from './string'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TextRule extends StringRule {}

// redefined to allow separate options for text and string as needed for extensions
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TextOptions extends StringOptions {}

export interface TextDefinition extends BaseSchemaDefinition {
  type: 'text'
  rows?: number
  options?: TextOptions
  validation?: ValidationBuilder<TextRule, string>
  initialValue?: InitialValueProperty<any, string>
}
