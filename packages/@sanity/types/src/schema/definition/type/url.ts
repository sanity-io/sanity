import {type UriValidationOptions} from '../../../validation/types'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {type BaseSchemaDefinition, type BaseSchemaTypeOptions} from './common'

/** @public */
export interface UrlRule extends RuleDef<UrlRule, string> {
  uri(options: UriValidationOptions): UrlRule
}

/** @public */
// only exists to support declaration extensions
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UrlOptions extends BaseSchemaTypeOptions {}

/** @public */
export interface UrlDefinition extends BaseSchemaDefinition {
  type: 'url'
  options?: UrlOptions
  placeholder?: string
  validation?: ValidationBuilder<UrlRule, string>
  initialValue?: InitialValueProperty<any, string>
}
