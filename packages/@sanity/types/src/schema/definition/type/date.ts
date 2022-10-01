import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition} from './common'

/** @public */
export interface DateOptions {
  calendarTodayLabel?: string
  dateFormat?: string
}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DateRule extends RuleDef<DateRule, string> {}

/** @public */
export interface DateDefinition extends BaseSchemaDefinition {
  type: 'date'
  options?: DateOptions
  placeholder?: string
  validation?: ValidationBuilder<DateRule, string>
  initialValue?: InitialValueProperty<any, string>
}
