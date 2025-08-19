import {type ComponentType} from 'react'

import {type UriValidationOptions} from '../../../validation/types'
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
export interface UrlRule extends RuleDef<UrlRule, string> {
  uri(options: UriValidationOptions): UrlRule
}

/** @public */
// only exists to support declaration extensions
export interface UrlOptions extends BaseSchemaTypeOptions {}

/**
 *
 * @hidden
 * @beta
 */
export interface UrlComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/** @public */
export interface UrlDefinition extends BaseSchemaDefinition {
  type: 'url'
  options?: UrlOptions
  placeholder?: string
  validation?: ValidationBuilder<UrlRule, string>
  initialValue?: InitialValueProperty<any, string>
  /**
   *
   * @hidden
   * @beta
   */
  components?: UrlComponents
}
