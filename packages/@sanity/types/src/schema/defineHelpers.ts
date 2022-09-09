import {PreviewConfig} from './preview'
import {InitialValueProperty, Schema, SchemaValidationValue} from './types'

export type DefineSchemaType<
  TType extends string,
  TAlias extends Schema.Type | undefined
> = TType extends Schema.Type
  ? Schema.IntrinsicTypeDefinition[TType]
  : Schema.TypeAliasDefinition<TType, TAlias>

export type StrictDefinition = boolean | undefined

export type MaybeStrict<TStrict extends StrictDefinition> = TStrict extends false
  ? {
      options?: {[index: string]: any}
      [index: string]: any
    }
  : unknown

type MaybePreview<
  Select extends Record<string, string> | undefined,
  PrepareValue extends Record<keyof Select, any> | undefined
> = Select extends Record<string, string>
  ? PrepareValue extends Record<keyof Select, any>
    ? PreviewConfig<Select, PrepareValue>
    : never
  : never

export type NarrowPreview<
  TType extends string,
  TAlias extends Schema.Type | undefined,
  TSelect extends Record<string, string> | undefined,
  TPrepareValue extends Record<keyof TSelect, any> | undefined
> = DefineSchemaType<TType, TAlias> extends {preview?: Record<string, any>}
  ? {
      preview?: MaybePreview<TSelect, TPrepareValue>
    }
  : unknown

// Must type-widen some fields on the way out of the define functions to be compatible with FieldDefinition and ArrayDefinition
export interface WidenValidation {
  validation?: SchemaValidationValue
}

export interface WidenInitialValue {
  initialValue?: InitialValueProperty<any, any>
}
