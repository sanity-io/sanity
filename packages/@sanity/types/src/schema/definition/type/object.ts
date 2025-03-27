import {type GridTemplateColumns, type ResponsiveProp} from '@sanity/ui/css'

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
  columns?: ResponsiveProp<GridTemplateColumns>
  modal?: {
    type?: 'dialog' | 'popover'
    width?: number | number[] | 'auto'
  }
}

/** @public */
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
