import {type ComponentType} from 'react'

import {type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {
  type PreviewProps,
  type PrimitiveItemProps,
  type StringFieldProps,
  type StringInputProps,
} from '../props'
import {type BaseSchemaDefinition} from './common'
import {type StringOptions, type StringRule} from './string'

/** @public */
export interface TextRule extends StringRule {}

/** @public */
// redefined to allow separate options for text and string as needed for extensions
export interface TextOptions extends StringOptions {}

/**
 *
 * @hidden
 * @beta
 */
export interface TextComponents {
  diff?: ComponentType<any>
  field?: ComponentType<StringFieldProps>
  input?: ComponentType<StringInputProps>
  item?: ComponentType<PrimitiveItemProps>
  preview?: ComponentType<PreviewProps>
}

/** @public */
export interface TextDefinition extends BaseSchemaDefinition {
  type: 'text'
  rows?: number
  options?: TextOptions
  placeholder?: string
  validation?: ValidationBuilder<TextRule, string>
  initialValue?: InitialValueProperty<any, string>
  /**
   *
   * @hidden
   * @beta
   */
  components?: TextComponents
}
