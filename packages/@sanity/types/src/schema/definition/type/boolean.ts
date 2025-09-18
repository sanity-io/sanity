import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {type BaseSchemaDefinition, type BaseSchemaTypeOptions} from './common'

/** @public */
export interface BooleanOptions extends BaseSchemaTypeOptions {
  layout?: 'switch' | 'checkbox'
}

/** @public */
export interface BooleanRule extends RuleDef<BooleanRule, boolean> {}

/** @public */
export interface BooleanDefinition extends BaseSchemaDefinition {
  type: 'boolean'
  options?: BooleanOptions
  elideIf?: boolean
  indeterminate?: boolean
  initialValue?: InitialValueProperty<any, boolean>
  validation?: ValidationBuilder<BooleanRule, boolean>
}
