import type {FieldReference} from '../../../validation'
import type {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import type {InitialValueProperty} from '../../types'
import type {BaseSchemaDefinition, EnumListProps} from './common'

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StringOptions extends EnumListProps<string> {}

/** @public */
export interface StringRule extends RuleDef<StringRule, string> {
  min: (minNumber: number | FieldReference) => StringRule
  max: (maxNumber: number | FieldReference) => StringRule
  length: (exactLength: number | FieldReference) => StringRule
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
