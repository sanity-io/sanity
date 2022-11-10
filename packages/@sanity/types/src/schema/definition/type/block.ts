import {ComponentType, ReactNode} from 'react'
import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {SchemaTypeDefinition, TypeReference} from '../schemaDefinition'
import {ArrayOfType} from './array'
import {BaseSchemaDefinition} from './common'

/** @public */
export interface BlockOptions {
  spellCheck?: boolean
}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BlockRule extends RuleDef<BlockRule, any[]> {}

/** @public */
export interface DecoratorDefinition {
  title: string
  value: string
  icon?: ReactNode | ComponentType<any>
  blockEditor?: {
    icon?: ReactNode | ComponentType<any>
    render?: ComponentType<any>
  }
}

/** @public */
export interface MarksDefinition {
  decorators?: DecoratorDefinition[]
  annotations?: (SchemaTypeDefinition | TypeReference)[]
}

/** @public */
export interface BlockDefinition extends BaseSchemaDefinition {
  type: 'block'
  styles?: Array<{title: string; value: string}>
  lists?: Array<{title: string; value: string}>
  marks?: MarksDefinition
  of?: ArrayOfType[]
  initialValue?: InitialValueProperty<any, any[]>
  options?: BlockOptions
  validation?: ValidationBuilder<BlockRule, any[]>
}
