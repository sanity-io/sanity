import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {Path} from '../../../paths'
import {SlugifierFn, SlugSourceFn} from '../../../slug'
import {SlugIsUniqueValidator} from '../../../validation'
import {BaseSchemaDefinition} from './common'

/** @public */
export interface SlugValue {
  _type: 'slug'
  current?: string
}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SlugRule extends RuleDef<SlugRule, SlugValue> {}

/** @public */
export interface SlugOptions {
  source?: string | Path | SlugSourceFn
  maxLength?: number
  slugify?: SlugifierFn
  isUnique?: SlugIsUniqueValidator
}

/** @public */
export interface SlugDefinition extends BaseSchemaDefinition {
  type: 'slug'
  options?: SlugOptions
  validation?: ValidationBuilder<SlugRule, SlugValue>
  initialValue?: InitialValueProperty<any, Omit<SlugValue, '_type'>>
}
