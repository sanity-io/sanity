import {ComponentType} from 'react'
import {FieldProps, InputProps, ItemProps} from './form'
import {DiffProps} from './field'
import {PreviewProps} from './components'

export interface SchemaComponents {
  diff?: ComponentType<DiffProps>
  field?: ComponentType<FieldProps>
  input?: ComponentType<InputProps>
  item?: ComponentType<ItemProps>
  preview?: ComponentType<PreviewProps>
}

declare module '@sanity/types' {
  export interface BaseSchemaDefinition {
    components?: SchemaComponents
  }
}
