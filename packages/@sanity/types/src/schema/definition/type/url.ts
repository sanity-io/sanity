import {UriValidationOptions} from '../../../validation/types'
import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition} from './common'

/** @public */
export interface UrlRule extends RuleDef<UrlRule, string> {
  uri(options: UriValidationOptions): UrlRule
}

/** @public */
// only exists to support declaration extensions
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UrlOptions {}

/** @public */
export interface UrlDefinition extends BaseSchemaDefinition {
  type: 'url'
  options?: UrlOptions
  placeholder?: string
  validation?: ValidationBuilder<UrlRule, string>
  initialValue?: InitialValueProperty<any, string>
}
