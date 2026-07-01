import {
  type ArrayOfEntry,
  type FieldDefinitionBase,
  type IntrinsicDefinitions,
  type IntrinsicTypeName,
  type TypeAliasDefinition,
} from './definition'
import {type PreviewConfig} from './preview'
import {type InitialValueProperty, type SchemaValidationValue} from './types'

/** @beta */
export interface DefineSchemaOptions<
  TStrict extends StrictDefinition,
  TAlias extends IntrinsicTypeName | undefined,
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
  TAlias extends IntrinsicTypeName | undefined,
> = TType extends IntrinsicTypeName ? IntrinsicBase[TType] : TypeAliasDefinition<TType, TAlias>

/** @beta */
export type DefineSchemaType<
  TType extends string,
  TAlias extends IntrinsicTypeName | undefined,
> = TType extends IntrinsicTypeName
  ? IntrinsicDefinitions[TType]
  : TypeAliasDefinition<TType, TAlias>

/** @beta */
export type DefineArrayMemberBase<
  TType extends string,
  TAlias extends IntrinsicTypeName | undefined,
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
export type NoExtraProperties<TActual, TExpected> = TActual &
  Record<Exclude<keyof TActual, keyof TExpected>, never> &
  NoExtraOptions<TActual, TExpected>

/** @beta */
export type NoExtraOptions<TActual, TExpected> = 'options' extends keyof TActual
  ? {} extends Pick<TActual, 'options'>
    ? unknown
    : 'options' extends keyof TExpected
      ? {options: NoExtraObjectProperties<TActual['options'], NonNullable<TExpected['options']>>}
      : unknown
  : unknown

/** @beta */
export type NoExtraObjectProperties<TActual, TExpected> = keyof TExpected extends never
  ? TActual
  : unknown extends TExpected
    ? TActual
    : TActual extends object
      ? TExpected extends object
        ? TActual & Record<Exclude<keyof TActual, keyof TExpected>, never>
        : TActual
      : TActual

/** @beta */
export type MaybeEnsureNoUnknownProps<
  TActual,
  TExpected,
  TStrict extends StrictDefinition,
> = TStrict extends false ? TActual : NoExtraProperties<TActual, TExpected>

/** @beta */
export type MaybePreview<
  Select extends Record<string, string> | undefined,
  PrepareValue extends Record<keyof Select, any> | undefined,
> =
  Select extends Record<string, string>
    ? PrepareValue extends Record<keyof Select, any>
      ? PreviewConfig<Select, PrepareValue>
      : never
    : never

/** @beta */
export type NarrowPreview<
  TType extends string,
  TAlias extends IntrinsicTypeName | undefined,
  TSelect extends Record<string, string> | undefined,
  TPrepareValue extends Record<keyof TSelect, any> | undefined,
> =
  DefineSchemaType<TType, TAlias> extends {preview?: Record<string, any>}
    ? {
        preview?: MaybePreview<TSelect, TPrepareValue>
      }
    : unknown

/** @beta */
export type DefineTypeDefinition<
  TType extends string,
  TName extends string,
  TSelect extends Record<string, string> | undefined,
  TPrepareValue extends Record<keyof TSelect, any> | undefined,
  TAlias extends IntrinsicTypeName | undefined,
  TStrict extends StrictDefinition,
> = {
  type: TType
  name: TName
} & DefineSchemaBase<TType, TAlias> &
  NarrowPreview<TType, TAlias, TSelect, TPrepareValue> &
  MaybeAllowUnknownProps<TStrict>

/** @beta */
export type DefineFieldDefinition<
  TType extends string,
  TName extends string,
  TSelect extends Record<string, string> | undefined,
  TPrepareValue extends Record<keyof TSelect, any> | undefined,
  TAlias extends IntrinsicTypeName | undefined,
  TStrict extends StrictDefinition,
> = DefineTypeDefinition<TType, TName, TSelect, TPrepareValue, TAlias, TStrict> &
  FieldDefinitionBase

/** @beta */
export type DefineArrayMemberDefinition<
  TType extends string,
  TName extends string,
  TSelect extends Record<string, string> | undefined,
  TPrepareValue extends Record<keyof TSelect, any> | undefined,
  TAlias extends IntrinsicTypeName | undefined,
  TStrict extends StrictDefinition,
> = {
  type: TType
  /**
   * When provided, `name` is used as `_type` for the array item when stored.
   *
   * Necessary when an array contains multiple entries with the same `type`, each with
   * different configuration (title and initialValue for instance).
   */
  name?: TName
} & DefineArrayMemberBase<TType, TAlias> &
  NarrowPreview<TType, TAlias, TSelect, TPrepareValue> &
  MaybeAllowUnknownProps<TStrict>

/** @beta */
// Must type-widen some fields on the way out of the define functions to be compatible with FieldDefinition and ArrayDefinition
export interface WidenValidation {
  validation?: SchemaValidationValue
}

/** @beta */
export type MaybeWidenValidation<TSchemaDefinition> = 'validation' extends keyof TSchemaDefinition
  ? WidenValidation
  : unknown

/** @beta */
export interface WidenInitialValue {
  initialValue?: InitialValueProperty<any, any>
}

/** @beta */
export type MaybeWidenInitialValue<TSchemaDefinition> =
  'initialValue' extends keyof TSchemaDefinition ? WidenInitialValue : unknown
