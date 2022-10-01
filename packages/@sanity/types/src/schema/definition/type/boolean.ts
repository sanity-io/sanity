import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition} from './common'

/** @public */
export interface BooleanOptions {
  layout?: 'switch' | 'checkbox'
}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BooleanRule extends RuleDef<BooleanRule, boolean> {}

/** @public */
export interface BooleanDefinition extends BaseSchemaDefinition {
  type: 'boolean'
  options?: BooleanOptions
  initialValue?: InitialValueProperty<any, boolean>
  validation?: ValidationBuilder<BooleanRule, boolean>
}
