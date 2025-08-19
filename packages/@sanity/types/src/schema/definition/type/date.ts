import {type ComponentType} from 'react'

import {type FieldReference} from '../../../validation'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {
  type PreviewProps,
  type PrimitiveItemProps,
  type StringFieldProps,
  type StringInputProps,
} from '../props'
import {type BaseSchemaDefinition, type BaseSchemaTypeOptions} from './common'

/** @public */
export interface DateOptions extends BaseSchemaTypeOptions {
  dateFormat?: string
}

/** @public */
export interface DateRule extends RuleDef<DateRule, string> {
  /**
   * @param minDate - Minimum date (inclusive). minDate should be in ISO 8601 format.
   */
  min: (minDate: string | FieldReference) => DateRule
  /**
   * @param maxDate - Maximum date (inclusive). maxDate should be in ISO 8601 format.
   */
  max: (maxDate: string | FieldReference) => DateRule
}

/**
 *
 * @hidden
 * @beta
 */
export interface DateComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/** @public */
export interface DateDefinition extends BaseSchemaDefinition {
  type: 'date'
  options?: DateOptions
  placeholder?: string
  validation?: ValidationBuilder<DateRule, string>
  initialValue?: InitialValueProperty<any, string>
  /**
   *
   * @hidden
   * @beta
   */
  components?: DateComponents
}
