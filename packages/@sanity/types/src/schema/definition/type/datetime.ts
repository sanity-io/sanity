import type {FieldReference} from '../../../validation'
import type {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import type {InitialValueProperty} from '../../types'
import type {BaseSchemaDefinition} from './common'

/** @public */
export interface DatetimeOptions {
  dateFormat?: string
  timeFormat?: string
  timeStep?: number
}

/** @public */
export interface DatetimeRule extends RuleDef<DatetimeRule, string> {
  /**
   * @param minDate - Minimum date (inclusive). minDate should be in ISO 8601 format.
   */
  min: (minDate: string | FieldReference) => DatetimeRule
  /**
   * @param maxDate - Maximum date (inclusive). maxDate should be in ISO 8601 format.
   */
  max: (maxDate: string | FieldReference) => DatetimeRule
}

/** @public */
export interface DatetimeDefinition extends BaseSchemaDefinition {
  type: 'datetime'
  options?: DatetimeOptions
  placeholder?: string
  validation?: ValidationBuilder<DatetimeRule, string>
  initialValue?: InitialValueProperty<any, string>
}
