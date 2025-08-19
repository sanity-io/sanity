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
import {
  type BaseSchemaDefinition,
  type BaseSchemaTypeOptions,
  type EnumListProps,
  type SearchConfiguration,
} from './common'

/** @public */
export interface StringOptions
  extends EnumListProps<string>,
    SearchConfiguration,
    BaseSchemaTypeOptions {}

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

/**
 *
 * @hidden
 * @beta
 */
export interface StringComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/** @public */
export interface StringDefinition extends BaseSchemaDefinition {
  type: 'string'
  options?: StringOptions
  placeholder?: string
  validation?: ValidationBuilder<StringRule, string>
  initialValue?: InitialValueProperty<any, string>
  /**
   *
   * @hidden
   * @beta
   */
  components?: StringComponents
}
