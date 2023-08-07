import {PreviewConfig} from '../../preview'
import {RuleDef, ValidationBuilder} from '../../ruleBuilder'
import {InitialValueProperty} from '../../types'
import {FieldDefinition} from '../schemaDefinition'
import {BaseSchemaDefinition, FieldGroupDefinition, FieldsetDefinition} from './common'

/** @public */
export interface ObjectOptions {
  collapsible?: boolean
  collapsed?: boolean
  columns?: number | number[]
  modal?: {
    type?: 'dialog' | 'popover'
    width?: number | number[] | 'auto'
  }
}

/** @public */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ObjectRule extends RuleDef<ObjectRule, Record<string, unknown>> {}

/** @public */
export interface ObjectDefinition extends BaseSchemaDefinition {
  type: 'object'
  /**
   * Object must have at least one field. This is validated at Studio startup.
   */
  fields: FieldDefinition[]
  groups?: FieldGroupDefinition[]
  fieldsets?: FieldsetDefinition[]
  preview?: PreviewConfig

  options?: ObjectOptions
  validation?: ValidationBuilder<ObjectRule, Record<string, unknown>>
  initialValue?: InitialValueProperty<any, Record<string, unknown>>
}
