import {UriValidationOptions} from '../../../validation/types'
import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {BaseSchemaDefinition} from './common'

export interface UrlRule extends RuleDef<UrlRule, string> {
  uri(options: UriValidationOptions): UrlRule
}

// only exists to support declaration extensions
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UrlOptions {}

export interface UrlDefinition extends BaseSchemaDefinition {
  type: 'url'
  options?: UrlOptions
  validation?: ValidationBuilder<UrlRule, string>
  initialValue?: InitialValueProperty<any, string>
}
