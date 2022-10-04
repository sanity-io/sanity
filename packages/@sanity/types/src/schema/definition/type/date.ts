import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition} from './common'

export interface DateOptions {
  calendarTodayLabel?: string
  dateFormat?: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DateRule extends RuleDef<DateRule, string> {}

export interface DateDefinition extends BaseSchemaDefinition {
  type: 'date'
  options?: DateOptions
  placeholder?: string
  validation?: ValidationBuilder<DateRule, string>
  initialValue?: InitialValueProperty<any, string>
}
