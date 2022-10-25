import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition, EnumListProps} from './common'

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NumberOptions extends EnumListProps<number> {}

/** @public */
export interface NumberRule extends RuleDef<NumberRule, number> {
  min: (minNumber: number) => NumberRule
  max: (maxNumber: number) => NumberRule
  lessThan: (limit: number) => NumberRule
  greaterThan: (limit: number) => NumberRule
  integer: () => NumberRule
  precision: (limit: number) => NumberRule
  positive: () => NumberRule
  negative: () => NumberRule
}

/** @public */
export interface NumberDefinition extends BaseSchemaDefinition {
  type: 'number'
  options?: NumberOptions
  placeholder?: string
  validation?: ValidationBuilder<NumberRule, number>
  initialValue?: InitialValueProperty<any, number>
}
