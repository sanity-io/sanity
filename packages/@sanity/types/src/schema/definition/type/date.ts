import {FieldReference} from '../../../validation'
import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition} from './common'

/** @public */
export interface DateOptions {
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

/** @public */
export interface DateDefinition extends BaseSchemaDefinition {
  type: 'date'
  options?: DateOptions
  placeholder?: string
  validation?: ValidationBuilder<DateRule, string>
  initialValue?: InitialValueProperty<any, string>
}
