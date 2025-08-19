import {type ComponentType} from 'react'

import {type Path} from '../../../paths'
import {type SlugifierFn, type SlugSourceFn} from '../../../slug'
import {type SlugIsUniqueValidator} from '../../../validation'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {
  type ObjectFieldProps,
  type ObjectInputProps,
  type ObjectItem,
  type ObjectItemProps,
  type PreviewProps,
} from '../props'
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
export interface SlugRule extends RuleDef<SlugRule, SlugValue> {}

/** @public */
export interface SlugOptions extends SearchConfiguration, BaseSchemaTypeOptions {
  source?: string | Path | SlugSourceFn
  maxLength?: number
  slugify?: SlugifierFn
  isUnique?: SlugIsUniqueValidator
  disableArrayWarning?: boolean
}

/**
 *
 * @hidden
 * @beta
 */
export interface SlugComponents {
  diff?: ComponentType<any>
  field?: ComponentType<ObjectFieldProps<SlugValue>>
  input?: ComponentType<ObjectInputProps<SlugValue>>
  item?: ComponentType<ObjectItemProps<SlugValue & ObjectItem>>
  preview?: ComponentType<PreviewProps>
}

/** @public */
export interface SlugDefinition extends BaseSchemaDefinition {
  type: 'slug'
  options?: SlugOptions
  validation?: ValidationBuilder<SlugRule, SlugValue>
  initialValue?: InitialValueProperty<any, Omit<SlugValue, '_type'>>
  /**
   *
   * @hidden
   * @beta
   */
  components?: SlugComponents
}
