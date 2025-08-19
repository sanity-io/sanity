import {type ComponentType} from 'react'

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
export interface EmailRule extends RuleDef<EmailRule, string> {}

/** @public */
// only exists to support declaration extensions
export interface EmailOptions extends BaseSchemaTypeOptions {}

/**
 *
 * @hidden
 * @beta
 */
export interface EmailComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/** @public */
export interface EmailDefinition extends BaseSchemaDefinition {
  type: 'email'
  options?: EmailOptions
  placeholder?: string
  validation?: ValidationBuilder<EmailRule, string>
  initialValue?: InitialValueProperty<any, string>
  /**
   *
   * @hidden
   * @beta
   */
  components?: EmailComponents
}
