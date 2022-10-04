import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {Path} from '../../../paths'
import {SlugifierFn, SlugSourceFn} from '../../../slug'
import {SlugIsUniqueValidator} from '../../../validation'
import {BaseSchemaDefinition} from './common'

export interface SlugValue {
  current?: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SlugRule extends RuleDef<SlugRule, SlugValue> {}

export interface SlugOptions {
  source?: string | Path | SlugSourceFn
  maxLength?: number
  slugify?: SlugifierFn
  isUnique?: SlugIsUniqueValidator
}

export interface SlugDefinition extends BaseSchemaDefinition {
  type: 'slug'
  options?: SlugOptions
  validation?: ValidationBuilder<SlugRule, SlugValue>
  initialValue?: InitialValueProperty<any, SlugValue>
}
