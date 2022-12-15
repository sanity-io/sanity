import {ComponentType, ReactNode} from 'react'
import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {ArrayOfType} from './array'
import {BaseSchemaDefinition} from './common'
import {ObjectDefinition} from './object'

/** @public */
export interface BlockOptions {
  spellCheck?: boolean
}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BlockRule extends RuleDef<BlockRule, any[]> {}

/** @public */
export interface BlockDecoratorDefinition {
  title: string
  value: string
  icon?: ReactNode | ComponentType
}

/** @public */
export interface BlockStyleDefinition {
  title: string
  value: string
}

/** @public */
export interface BlockListDefinition {
  title: string
  value: string
  icon?: ReactNode | ComponentType
}

/** @public */
export interface BlockAnnotationDefinition extends ObjectDefinition {
  icon?: ReactNode | ComponentType
}

/** @public */
export interface BlockMarksDefinition {
  decorators?: BlockDecoratorDefinition[]
  annotations?: ArrayOfType<'object' | 'reference'>[]
}

/** @public */
export interface BlockDefinition extends BaseSchemaDefinition {
  type: 'block'
  styles?: BlockStyleDefinition[]
  lists?: BlockListDefinition[]
  marks?: BlockMarksDefinition
  of?: ArrayOfType<'object' | 'reference'>[]
  initialValue?: InitialValueProperty<any, any[]>
  options?: BlockOptions
  validation?: ValidationBuilder<BlockRule, any[]>
}
