import type {PreviewConfig} from './preview'
import type {InitialValueProperty, Schema, SchemaValidationValue} from './types'

export interface DefineOptions<
  TStrict extends StrictDefinition,
  TAlias extends Schema.Type | undefined
> {
  /**
   * `strict: false` allows unknown properties in the schema.
   * Use this when adding customizations to the schema that are not part of sanity core.
   *
   * If you want to extend the Sanity Schema types with your own properties or options to make them typesafe,
   * you can use [TypeScript declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).
   *
   * See {@link defineType} for more.
   *
   * @see defineType
   */
  strict?: TStrict
  /** Should be provided when type is a non-intrinsic type, ie type is a type alias */
  aliasFor?: TAlias extends Schema.Type ? TAlias : never
}

export type IntrinsicBase = {
  [K in keyof Schema.IntrinsicTypeDefinition]: Omit<Schema.IntrinsicTypeDefinition[K], 'preview'>
}

export type IntrinsicArrayOfBase = {
  [K in keyof Schema.IntrinsicTypeDefinition]: Omit<
    Schema.ArrayOfEntry<Schema.IntrinsicTypeDefinition[K]>,
    'preview'
  >
}

export type DefineSchemaBase<
  TType extends string,
  TAlias extends Schema.Type | undefined
> = TType extends Schema.Type ? IntrinsicBase[TType] : Schema.TypeAliasDefinition<TType, TAlias>

export type DefineSchemaType<
  TType extends string,
  TAlias extends Schema.Type | undefined
> = TType extends Schema.Type
  ? Schema.IntrinsicTypeDefinition[TType]
  : Schema.TypeAliasDefinition<TType, TAlias>

export type DefineArrayMemberBase<
  TType extends string,
  TAlias extends Schema.Type | undefined
> = TType extends Schema.Type
  ? IntrinsicArrayOfBase[TType]
  : Schema.ArrayOfEntry<Schema.TypeAliasDefinition<string, TAlias>>

export type StrictDefinition = boolean | undefined

export type MaybeAllowUnknownProps<TStrict extends StrictDefinition> = TStrict extends false
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
