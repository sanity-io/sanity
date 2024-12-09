import {type PreviewConfig} from '../../preview'
import {type RuleDef, type ValidationBuilder} from '../../ruleBuilder'
import {type InitialValueProperty} from '../../types'
import {type FieldDefinition} from '../schemaDefinition'
import {
  type BaseSchemaDefinition,
  type BaseSchemaTypeOptions,
  type FieldGroupDefinition,
  type FieldsetDefinition,
} from './common'

/** @public */
export interface ObjectOptions extends BaseSchemaTypeOptions {
  collapsible?: boolean
  collapsed?: boolean
  columns?: number
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
