import type {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import type {InitialValueProperty} from '../../types'
import type {BaseSchemaDefinition} from './common'

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EmailRule extends RuleDef<EmailRule, string> {}

/** @public */
// only exists to support declaration extensions
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EmailOptions {}

/** @public */
export interface EmailDefinition extends BaseSchemaDefinition {
  type: 'email'
  options?: EmailOptions
  placeholder?: string
  validation?: ValidationBuilder<EmailRule, string>
  initialValue?: InitialValueProperty<any, string>
}
