import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition, EnumListProps} from './common'

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StringOptions extends EnumListProps<string> {}

/** @public */
export interface StringRule extends RuleDef<StringRule, string> {
  min: (minNumber: number) => StringRule
  max: (maxNumber: number) => StringRule
  length: (exactLength: number) => StringRule
  uppercase: () => StringRule
  lowercase: () => StringRule
  regex(pattern: RegExp, name: string, options: {name?: string; invert?: boolean}): StringRule
  regex(pattern: RegExp, options: {name?: string; invert?: boolean}): StringRule
  regex(pattern: RegExp, name: string): StringRule
  regex(pattern: RegExp): StringRule
  email(): StringRule
}

/** @public */
export interface StringDefinition extends BaseSchemaDefinition {
  type: 'string'
  options?: StringOptions
  placeholder?: string
  validation?: ValidationBuilder<StringRule, string>
  initialValue?: InitialValueProperty<any, string>
}
