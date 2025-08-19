import {type ComponentType} from 'react'

import {type FieldReference} from '../../../validation'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {
  type NumberFieldProps,
  type NumberInputProps,
  type PreviewProps,
  type PrimitiveItemProps,
} from '../props'
import {type BaseSchemaDefinition, type BaseSchemaTypeOptions, type EnumListProps} from './common'

/** @public */
export interface NumberOptions extends EnumListProps<number>, BaseSchemaTypeOptions {}

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

/**
 *
 * @hidden
 * @beta
 */
export interface NumberComponents {
  diff?: ComponentType<any>
  field?: ComponentType<NumberFieldProps>
  input?: ComponentType<NumberInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/** @public */
export interface NumberDefinition extends BaseSchemaDefinition {
  type: 'number'
  options?: NumberOptions
  placeholder?: string
  validation?: ValidationBuilder<NumberRule, number>
  initialValue?: InitialValueProperty<any, number>
  /**
   *
   * @hidden
   * @beta
   */
  components?: NumberComponents
}
