import {type ComponentType} from 'react'

import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {
  type BooleanFieldProps,
  type BooleanInputProps,
  type PreviewProps,
  type PrimitiveItemProps,
} from '../props'
import {type BaseSchemaDefinition, type BaseSchemaTypeOptions} from './common'

/** @public */
export interface BooleanOptions extends BaseSchemaTypeOptions {
  layout?: 'switch' | 'checkbox'
}

/** @public */
export interface BooleanRule extends RuleDef<BooleanRule, boolean> {}

/**
 *
 * @hidden
 * @beta
 */
export interface BooleanComponents {
  diff?: ComponentType<any>
  field?: ComponentType<BooleanFieldProps>
  input?: ComponentType<BooleanInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/** @public */
export interface BooleanDefinition extends BaseSchemaDefinition {
  type: 'boolean'
  options?: BooleanOptions
  initialValue?: InitialValueProperty<any, boolean>
  validation?: ValidationBuilder<BooleanRule, boolean>
  components?: BooleanComponents
}
