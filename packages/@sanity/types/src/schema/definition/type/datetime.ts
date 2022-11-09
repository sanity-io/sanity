import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition} from './common'

/** @public */
export interface DatetimeOptions {
  dateFormat?: string
  timeFormat?: string
  timeStep?: number
}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DatetimeRule extends RuleDef<DatetimeRule, string> {
  /**
   * @param minDate - Minimum date (inclusive). minDate should be in ISO 8601 format.
   */
  min: (minDate: string) => DatetimeRule
  /**
   * @param maxDate - Maximum date (inclusive). maxDate should be in ISO 8601 format.
   */
  max: (maxDate: string) => DatetimeRule
}

/** @public */
export interface DatetimeDefinition extends BaseSchemaDefinition {
  type: 'datetime'
  options?: DatetimeOptions
  placeholder?: string
  validation?: ValidationBuilder<DatetimeRule, string>
  initialValue?: InitialValueProperty<any, string>
}
