import {
  ArrayOfEntry,
  IntrinsicDefinitions,
  TypeAliasDefinition,
  IntrinsicTypeName,
} from './definition'
import type {PreviewConfig} from './preview'
import type {InitialValueProperty, SchemaValidationValue} from './types'

/** @beta */
export interface DefineSchemaOptions<
  TStrict extends StrictDefinition,
  TAlias extends IntrinsicTypeName | undefined
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
  aliasFor?: TAlias extends IntrinsicTypeName ? TAlias : never
}

/** @beta */
export type IntrinsicBase = {
  [K in keyof IntrinsicDefinitions]: Omit<IntrinsicDefinitions[K], 'preview'>
}

/** @beta */
export type IntrinsicArrayOfBase = {
  [K in keyof IntrinsicDefinitions]: Omit<ArrayOfEntry<IntrinsicDefinitions[K]>, 'preview'>
}

/** @beta */
export type DefineSchemaBase<
  TType extends string,
  TAlias extends IntrinsicTypeName | undefined
> = TType extends IntrinsicTypeName ? IntrinsicBase[TType] : TypeAliasDefinition<TType, TAlias>

/** @beta */
export type DefineSchemaType<
  TType extends string,
  TAlias extends IntrinsicTypeName | undefined
> = TType extends IntrinsicTypeName
  ? IntrinsicDefinitions[TType]
  : TypeAliasDefinition<TType, TAlias>

/** @beta */
export type DefineArrayMemberBase<
  TType extends string,
  TAlias extends IntrinsicTypeName | undefined
> = TType extends IntrinsicTypeName
  ? IntrinsicArrayOfBase[TType]
  : ArrayOfEntry<TypeAliasDefinition<string, TAlias>>

/** @beta */
export type StrictDefinition = boolean | undefined

/** @beta */
export type MaybeAllowUnknownProps<TStrict extends StrictDefinition> = TStrict extends false
  ? {
      options?: {[index: string]: any}
      [index: string]: any
    }
  : unknown

/** @beta */
export type MaybePreview<
  Select extends Record<string, string> | undefined,
  PrepareValue extends Record<keyof Select, any> | undefined
> = Select extends Record<string, string>
  ? PrepareValue extends Record<keyof Select, any>
    ? PreviewConfig<Select, PrepareValue>
    : never
  : never

/** @beta */
export type NarrowPreview<
  TType extends string,
  TAlias extends IntrinsicTypeName | undefined,
  TSelect extends Record<string, string> | undefined,
  TPrepareValue extends Record<keyof TSelect, any> | undefined
> = DefineSchemaType<TType, TAlias> extends {preview?: Record<string, any>}
  ? {
      preview?: MaybePreview<TSelect, TPrepareValue>
    }
  : unknown

/** @beta */
// Must type-widen some fields on the way out of the define functions to be compatible with FieldDefinition and ArrayDefinition
export interface WidenValidation {
  validation?: SchemaValidationValue
}

/** @beta */
export interface WidenInitialValue {
  initialValue?: InitialValueProperty<any, any>
}
