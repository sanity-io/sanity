import {FieldReference} from '../../../validation'
import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition, EnumListProps} from './common'

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NumberOptions extends EnumListProps<number> {}

/** @public */
export interface NumberRule extends RuleDef<NumberRule, number> {
  min: (minNumber: number | FieldReference) => NumberRule
  max: (maxNumber: number | FieldReference) => NumberRule
  lessThan: (limit: number | FieldReference) => NumberRule
  greaterThan: (limit: number | FieldReference) => NumberRule
  integer: () => NumberRule
  precision: (limit: number | FieldReference) => NumberRule
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
