import {Schema} from './types'
import {
  DefineArrayOfBase,
  DefineOptions,
  DefineSchemaBase,
  MaybeAllowUnknownProps,
  NarrowPreview,
  StrictDefinition,
  WidenInitialValue,
  WidenValidation,
} from './defineTypes'

/**
 * Define a Sanity type definition. This function will narrow the schema type down to fields and options based on the provided
 *  type-string.
 *
 * Schemas defined using `defineType` should typically be added to the Studio config under `schema.types`.
 * Defined types can be references by their `name`. This is referred to as a type-alias.
 *
 * When using type-aliases as `type`, `defineType` cannot know the base-type, so type-safety will be reduced.
 * If you know the base type of the type-alias, provide `defineOptions.alias: <base type name>`.
 * This will enforce that the schema definition conforms with the provided type.
 *
 * By default `defineType` only known properties are allowed.
 * Use `defineOptions.strict: false` to allow unknown fields and options.
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
 * ### Usage with alias narrowing
 *
 * ```ts
 * defineType({
 *   type: 'custom-object',
 *   name: 'redefined-custom-object',
 *   options: {
 *     columns: 2
 *   }
 * }, {alias: 'object' })
 * ```
 *
 * ### Allow unknown props
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
 * }, {strict: false })
 * ```
 * ### Maximum safety and best autocompletion
 *
 * Use {@link defineType}, {@link defineField} and {@link defineArrayOf}:
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
 *          defineArrayOf({
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
 * Type-safety in arrays (`fields`, `of` ect) can only be guaranteed when {@link defineField} and {@link defineArrayOf}
 * are used to wrap array-entries.
 *
 * For entries without a function-wrapper, TypeScript will resolve to a union type of all possible properties across
 * all schema-types will be allowed.
 *
 * @param schemaDefinition - should be a valid Sanity schema type definition.
 * @param defineOptions - optional param to provide typehints for the schemaDefinition.
 *
 * @see defineField
 * @see defineArrayOf
 * @see typed
 */
export function defineType<
  TType extends string | Schema.Type, // Schema.Type here improves autocompletion in _some_ IDEs (not VS Code atm)
  TName extends string,
  TSelect extends Record<string, string> | undefined,
  TPrepareValue extends Record<keyof TSelect, any> | undefined,
  TAlias extends Schema.Type | undefined,
  TStrict extends StrictDefinition
>(
  schemaDefinition: {
    type: TType
    name: TName
  } & DefineSchemaBase<TType, TAlias> &
    NarrowPreview<TType, TAlias, TSelect, TPrepareValue> &
    MaybeAllowUnknownProps<TStrict>,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defineOptions?: DefineOptions<TStrict, TAlias>
): typeof schemaDefinition {
  return schemaDefinition
}

/**
 * Define a Sanity field within a document, object, image or file definition `fields` array.
 *
 * This function will narrow the schema type down to fields and options based on the provided
 * type-string.
 *
 * Using `defineField` is optional, but should provide improved autocompletion in your IDE, when building your schema.
 * Field-properties like `validation` and `initialValue`will also be more specific.
 *
 * ### Note on image fields
 * Sanity image fields has additional options. To make them legal in `defineField`, set `imageField: true`
 * in `defineOptions`:
 *
 * ```ts
 * defineField({
 *     type: 'string',
 *     name: 'stringWithImageFieldOptions',
 *     options: {
 *       isHighlighted: true,
 *       // other string options
 *     },
 *   },
 *   {imageField: true}
 * ),
 * ```
 *
 *
 * See {@link defineType} for more examples.
 *
 * @param schemaField - should be a valid Sanity field type definition.
 * @param defineOptions - optional param to provide typehints for the schemaField.
 *
 * @see defineField
 * @see defineArrayOf
 * @see typed
 */
export function defineField<
  TType extends string | Schema.Type, // Schema.Type here improves autocompletion in _some_ IDEs (not VS Code atm)
  TName extends string,
  TSelect extends Record<string, string> | undefined,
  TPrepareValue extends Record<keyof TSelect, any> | undefined,
  TAlias extends Schema.Type | undefined,
  TStrict extends StrictDefinition,
  TImageField extends boolean | undefined
>(
  schemaField: {
    type: TType
    name: TName
  } & DefineSchemaBase<TType, TAlias> &
    NarrowPreview<TType, TAlias, TSelect, TPrepareValue> &
    MaybeAllowUnknownProps<TStrict> &
    Schema.FieldBase &
    (TImageField extends true ? {options?: Schema.AssetFieldOptions} : unknown),

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defineOptions?: DefineOptions<TStrict, TAlias> & {
    /**
     * Set this to true for fields in an image object.
     * It will allow additional options relevant in that context.
     * */
    imageField?: TImageField
  }
): typeof schemaField & WidenValidation & WidenInitialValue {
  return schemaField
}

/**
 * Define a Sanity array item type within an array definition `of`-array.
 *
 * This function will narrow the schema type down to fields and options based on the provided
 * type-string.
 *
 * Using `defineArrayOf` is optional, but should provide improved autocompletion in your IDE, when building your schema.
 * Field-properties like `validation` and `initialValue`will also be more specific.
 *
 * See {@link defineType} for example usage.
 *
 * @param arrayOfSchema - should be a valid Sanity array.of type definition.
 * @param defineOptions - optional param to provide typehints for the arrayOfSchema.
 *
 * @see defineType
 * @see defineField
 * @see typed
 */
export function defineArrayOf<
  TType extends string | Schema.Type, // Schema.Type here improves autocompletion in _some_ IDEs (not VS Code atm)
  TName extends string,
  TSelect extends Record<string, string> | undefined,
  TPrepareValue extends Record<keyof TSelect, any> | undefined,
  TAlias extends Schema.Type | undefined,
  TStrict extends StrictDefinition
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
  } & DefineArrayOfBase<TType, TAlias> &
    NarrowPreview<TType, TAlias, TSelect, TPrepareValue> &
    MaybeAllowUnknownProps<TStrict>,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defineOptions?: DefineOptions<TStrict, TAlias>
): typeof arrayOfSchema & WidenValidation & WidenInitialValue {
  return arrayOfSchema
}

/**
 * `typed` can be used to ensure that a object conforms to an exact interface.
 *
 * It can be useful when working with `defineType` and `defineField` on occasions where a wider type with
 * custom options or properties is required.
 *
 * ## Example  usage
 * ```ts
 *  defineField({
 *    type: 'string',
 *    name: 'nestedField',
 *    options: typed<AssetFieldOptions & Schema.StringOptions>({
 *      isHighlighted: true,
 *      layout: 'radio',
 *      //@ts-expect-error unknownProp is not part of AssetFieldOptions & Schema.StringOptions
 *      unknownProp: 'not allowed in typed context',
 *    }),
 *  }),
 * ```
 *
 * @param input - returned directly
 */
export function typed<T>(input: T): T {
  return input
}
