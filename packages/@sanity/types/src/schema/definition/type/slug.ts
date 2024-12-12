import {type Path} from '../../../paths'
import {type SlugifierFn, type SlugSourceFn} from '../../../slug'
import {type SlugIsUniqueValidator} from '../../../validation'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {
  type BaseSchemaDefinition,
  type BaseSchemaTypeOptions,
  type SearchConfiguration,
} from './common'

/** @public */
export interface SlugValue {
  _type: 'slug'
  current?: string
}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SlugRule extends RuleDef<SlugRule, SlugValue> {}

/** @public */
export interface SlugOptions extends SearchConfiguration, BaseSchemaTypeOptions {
  source?: string | Path | SlugSourceFn
  maxLength?: number
  slugify?: SlugifierFn
  isUnique?: SlugIsUniqueValidator
  disableArrayWarning?: boolean
}

/** @public */
export interface SlugDefinition extends BaseSchemaDefinition {
  type: 'slug'
  options?: SlugOptions
  validation?: ValidationBuilder<SlugRule, SlugValue>
  initialValue?: InitialValueProperty<any, Omit<SlugValue, '_type'>>
}
