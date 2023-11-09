import type {
  DefineArrayMemberBase,
  DefineSchemaOptions,
  DefineSchemaBase,
  MaybeAllowUnknownProps,
  NarrowPreview,
  StrictDefinition,
  WidenInitialValue,
  WidenValidation,
} from './defineTypes'
import type {FieldDefinitionBase, IntrinsicTypeName} from './definition'

/**
 * Helper function for defining a Sanity type definition. This function does not do anything on its own;
 * it exists to check that your schema definition is correct, and help autocompletion in your IDE.
 *
 * This function will narrow the schema type down to fields and options based on the provided type-string.
 *
 * Schemas defined using `defineType` should typically be added to the Studio config under `schema.types`.
 * Defined types can be referenced by their `name`. This is referred to as a type-alias.
 *
 * When using type-aliases as `type`, `defineType` cannot know the base-type, so type-safety will be reduced.
 * If you know the base type of the type-alias, provide `defineOptions.aliasFor: <base type name>`.
 * This will enforce that the schema definition conforms with the provided type.
 *
 * By default, `defineType` only allows known properties and options.
 * Use `defineOptions.strict: false` to allow unknown properties and options.
 *
 * ### Basic usage
 *
 * ```ts
 * defineType({
 *   type: 'object',
 *   name: 'custom-object',
 *   fields: [ {type: 'string', name: 'title', title: 'Title'}],
 * })
 * ```
 *
 * ### Usage with aliasFor narrowing
 *
 * ```ts
 * defineType({
 *   type: 'custom-object',
 *   name: 'redefined-custom-object',
 *   options: {
 *     columns: 2
 *   }
 * }, {aliasFor: 'object' })
 * ```
 *
 * ### Allow unknown properties
 *
 * ```ts
 * defineType({
 *   type: 'custom-object',
 *   name: 'redefined-custom-object',
 *   allowsUnknownProperties: true
 *   options: {
 *     columns: 2,
 *     allowsUnknownOptions: true
 *   }
 * }, {strict: false})
 * ```
 * ### Maximum safety and best autocompletion
 *
 * Use {@link defineType}, {@link defineField} and {@link defineArrayMember}:
 *
 * ```ts
 *  defineType({
 *    type: 'object',
 *    name: 'custom-object',
 *    fields: [
 *      defineField({
 *        type: 'array',
 *        name: 'arrayField',
 *        title: 'Things',
 *        of: [
 *          defineArrayMember({
 *            type: 'object',
 *            name: 'type-name-in-array',
 *            fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
 *          }),
 *        ],
 *      }),
 *    ],
 *  })
 * ```
 *
 * ## Note on type-safety in the current implementation
 *
 * Type-safety inside array-like properties (schema properties like `fields` and `of`) can only be guaranteed when
 * {@link defineField} and {@link defineArrayMember} are used to wrap each value in the array.
 *
 * For array-values without a function-wrapper, TypeScript will resolve to a union type of all possible properties across
 * all schema types. This result in less precise typing.
 *
 * ### Extending the Sanity Schema types
 *
 * If you want to extend the Sanity Schema types with your own properties or options to make them typesafe,
 * you can use [TypeScript declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).
 *
 * With declaration merging, properties and options will be available in a type-safe manner, and
 * `strict: false` will not be necessary.
 *
 * #### Example: Add option to StringOptions
 *
 * ```ts
 * // string.ts
 *
 * //redeclare the sanity module
 * declare module 'sanity' {
 *  // redeclare StringOptions; it will be merged with StringOptions in the sanity module
 *  export interface StringOptions {
 *    myCustomOption?: boolean
 *  }
 * }
 *
 * // the option is now part of the StringOptions type, just as if it was declared in the sanity codebase:
 * defineType({
 *   type: 'string',
 *   name: 'my-string',
 *   options: {
 *     myCustomOption: true // this does not give an error anymore
 *   }
 * })
 *
 * ```
 *
 * #### Example: Add a schema definition to "intrinsic-types"
 *
 * ```ts
 * //my-custom-type-definition.ts
 *
 * // create a new schema definition based on object (we remove the ability to assign field, change the type add some options)
 *  export type MagicallyAddedDefinition = Omit<Schema.ObjectDefinition, 'type' | 'fields'> & {
 *    type: 'magically-added-type'
 *    options?: {
 *      sparkles?: boolean
 *    }
 *  }
 *
 *  // redeclares sanity module so we can add interfaces props to it
 * declare module 'sanity' {
 *     // redeclares IntrinsicDefinitions and adds a named definition to it
 *     // it is important that the key is the same as the type in the definition ('magically-added-type')
 *     export interface IntrinsicDefinitions {
 *       'magically-added-type': MagicallyAddedDefinition
 *     }
 * }
 *
 * // defineType will now narrow `type: 'magically-added-type'` to `MagicallyAddedDefinition`
 * defineType({
 *   type: 'magically-added-type'
 *   name: 'magic',
 *   options: {
 *     sparkles: true // this is allowed,
 *     //@ts-expect-error this is not allowed in MagicallyAddedDefinition.options
 *     sparks: true
 *   }
 * })
 * ```
 *
 * @param schemaDefinition - should be a valid schema type definition.
 * @param defineOptions - optional param to provide type hints for `schemaDefinition`.
 *
 * @see defineField
 * @see defineArrayMember
 * @see typed
 *
 * @beta
 */
export function defineType<
  TType extends string | IntrinsicTypeName, // IntrinsicTypeName here improves autocompletion in _some_ IDEs (not VS Code atm)
  TName extends string,
  TSelect extends Record<string, string> | undefined,
  TPrepareValue extends Record<keyof TSelect, any> | undefined,
  TAlias extends IntrinsicTypeName | undefined,
  TStrict extends StrictDefinition,
>(
  schemaDefinition: {
    type: TType
    name: TName
  } & DefineSchemaBase<TType, TAlias> &
    NarrowPreview<TType, TAlias, TSelect, TPrepareValue> &
    MaybeAllowUnknownProps<TStrict>,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defineOptions?: DefineSchemaOptions<TStrict, TAlias>,
): typeof schemaDefinition {
  return schemaDefinition
}

/**
 * Define a field within a document, object, image or file definition `fields` array.
 *
 * This function will narrow the schema type down to fields and options based on the provided
 * type-string.
 *
 * Using `defineField` is optional, but should provide improved autocompletion in your IDE, when building your schema.
 * Field-properties like `validation` and `initialValue`will also be more specific.
 *
 * See {@link defineType} for more examples.
 *
 * @param schemaField - should be a valid field type definition.
 * @param defineOptions - optional param to provide type hints for `schemaField`.
 *
 * @see defineField
 * @see defineArrayMember
 * @see typed
 *
 * @beta
 */
export function defineField<
  TType extends string | IntrinsicTypeName, // IntrinsicTypeName here improves autocompletion in _some_ IDEs (not VS Code atm)
  TName extends string,
  TSelect extends Record<string, string> | undefined,
  TPrepareValue extends Record<keyof TSelect, any> | undefined,
  TAlias extends IntrinsicTypeName | undefined,
  TStrict extends StrictDefinition,
>(
  schemaField: {
    type: TType
    name: TName
  } & DefineSchemaBase<TType, TAlias> &
    NarrowPreview<TType, TAlias, TSelect, TPrepareValue> &
    MaybeAllowUnknownProps<TStrict> &
    FieldDefinitionBase,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defineOptions?: DefineSchemaOptions<TStrict, TAlias>,
): typeof schemaField & WidenValidation & WidenInitialValue {
  return schemaField
}

/**
 * Define an array item member type within an array definition `of`-array.
 *
 * This function will narrow the schema type down to fields and options based on the provided
 * `type` string.
 *
 * Using `defineArrayMember` is optional, but should provide improved autocompletion in your IDE, when building your schema.
 * Field properties like `validation` and `initialValue` will also be more specific.
 *
 * See {@link defineType} for example usage.
 *
 * @param arrayOfSchema - should be a valid `array.of` member definition.
 * @param defineOptions - optional param to provide type hints for `arrayOfSchema`.
 *
 * @see defineType
 * @see defineField
 * @see typed
 *
 * @beta
 */
export function defineArrayMember<
  TType extends string | IntrinsicTypeName, // IntrinsicTypeName here improves autocompletion in _some_ IDEs (not VS Code atm)
  TName extends string,
  TSelect extends Record<string, string> | undefined,
  TPrepareValue extends Record<keyof TSelect, any> | undefined,
  TAlias extends IntrinsicTypeName | undefined,
  TStrict extends StrictDefinition,
>(
  arrayOfSchema: {
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
    MaybeAllowUnknownProps<TStrict>,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defineOptions?: DefineSchemaOptions<TStrict, TAlias>,
): typeof arrayOfSchema & WidenValidation & WidenInitialValue {
  return arrayOfSchema
}

/**
 * `typed` can be used to ensure that an object conforms to an exact interface.
 *
 * It can be useful when working with `defineType` and `defineField` on occasions where a wider type with
 * custom options or properties is required.
 *
 * ## Example  usage
 * ```ts
 *  defineField({
 *    type: 'string',
 *    name: 'nestedField',
 *    options: typed<StringOptions & {myCustomOption: boolean}>({
 *      layout: 'radio',
 *      // allowed
 *      myCustomOption: true,
 *      //@ts-expect-error unknownProp is not part of StringOptions & {myCustomOption: boolean}
 *      unknownProp: 'not allowed in typed context',
 *    }),
 *  }),
 * ```
 *
 * @param input - returned directly
 *
 * @internal
 */
export function typed<T>(input: T): T {
  return input
}
