import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition} from './common'

export interface BooleanOptions {
  layout?: 'switch' | 'checkbox'
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BooleanRule extends RuleDef<BooleanRule, boolean> {}

export interface BooleanDefinition extends BaseSchemaDefinition {
  type: 'boolean'
  options?: BooleanOptions
  initialValue?: InitialValueProperty<any, boolean>
  validation?: ValidationBuilder<BooleanRule, boolean>
}
