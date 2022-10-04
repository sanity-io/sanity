import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition, EnumListProps} from './common'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StringOptions extends EnumListProps<string> {}

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
}

export interface StringDefinition extends BaseSchemaDefinition {
  type: 'string'
  options?: StringOptions
  validation?: ValidationBuilder<StringRule, string>
  initialValue?: InitialValueProperty<any, string>
}
