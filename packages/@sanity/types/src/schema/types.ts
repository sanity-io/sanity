// Note: INCOMPLETE, but it's a start
import type {ComponentType, ReactNode} from 'react'
import {SanityClient} from '@sanity/client'
import type {Rule} from '../validation'
import {UriValidationOptions} from '../validation'
import type {ReferenceOptions} from '../reference'
import type {AssetSource} from '../assets'
import type {SlugOptions} from '../slug'
import type {SanityDocument} from '../documents'
import type {CurrentUser} from '../user'
import type {PreviewConfig} from './preview'
import {RuleDef, ValidationBuilder} from './ruleBuilder'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Schema {
  /**
   * This type can be extended being a interface and not a type, via declaration merging
   */
  export interface IntrinsicTypeDefinition {
    array: ArrayDefinition
    block: BlockDefinition
    boolean: BooleanDefinition
    date: DateDefinition
    datetime: DatetimeDefinition
    document: DocumentDefinition
    file: FileDefinition
    geopoint: GeopointDefinition
    image: ImageDefinition
    number: NumberDefinition
    object: ObjectDefinition
    reference: ReferenceDefinition
    crossDatasetReference: CrossDatasetReferenceDefinition
    slug: SlugDefinition
    string: StringDefinition
    text: TextDefinition
    url: UrlDefinition
    // TODO not sure if these should or needs to be here
    // "not something you create yourself"
    //span: SpanDefinition
  }

  /**
   * A union of all intrinsic types allowed natively in the schema.
   */
  export type Type = IntrinsicTypeDefinition[keyof IntrinsicTypeDefinition]['type']

  export type NarrowType<T = never> = T extends Type ? T : never

  /**
   * Represents a Sanity schema type definition.
   *
   * It's recommend to use the `defineType` helper instead of this type by
   * itself.
   */
  export type TypeDefinition<TType extends Type = Type> =
    | IntrinsicTypeDefinition[Type]
    | TypeAliasDefinition<string, TType>

  /**
   * Represents a reference to another type registered top-level in your schema.
   */
  export interface TypeReference {
    type: string
    name?: string
    options?: {[key: string]: unknown}
  }

  /**
   * Represents a type definition that is an alias/extension of an existing type
   * in your schema. Creating a type alias will re-register that existing type
   * under a different name. You can also override the default type options with
   * a type alias definition.
   */
  export interface TypeAliasDefinition<TType extends string, TAlias extends Type | undefined>
    extends BaseDefinitionOptions {
    type: TType
    options?: TAlias extends Type
      ? IntrinsicTypeDefinition[TAlias]['options']
      : {[key: string]: unknown}

    validation?: SchemaValidationValue
    initialValue?: InitialValueProperty<any, any>
  }

  export interface FieldBase {
    fieldset?: string
    group?: string | string[]
    /*    hidden?: ConditionalProperty
    readOnly?: ConditionalProperty
    validation?: SchemaValidationValue*/
  }

  export type InferSchemaDef<
    TType extends string,
    TAlias extends Schema.Type | undefined,
    TArrayType extends string | undefined
  > = TType extends 'array'
    ? TArrayType extends 'string'
      ? Schema.StringArrayDefinition
      : Schema.ObjectArrayDefinition
    : TType extends Schema.Type
    ? Schema.IntrinsicTypeDefinition[TType]
    : Schema.TypeAliasDefinition<TType, TAlias>

  /**
   * The shape of a field definition. Note, it's recommended to use the
   * `defineField` function instead of using this type directly.
   *
   * Where `defineField` infers the exact field type,
   * FieldDefinition is a compromise union of all types a field can have.
   *
   * A field definition can be a reference to another registered top-level type
   * or a inline type definition.
   */
  export type FieldDefinition<TType extends Type = Type> = Omit<
    Schema.IntrinsicTypeDefinition[TType] | Schema.TypeAliasDefinition<string, TType>,
    'validation' | 'initialValue'
  > &
    FieldBase /* compromises */ & {
      name: string
      validation?: SchemaValidationValue
      initialValue?: InitialValueProperty<any, any>

      /* compromises for inline field definitions without defineType*/
      fields?: FieldDefinition[]
      of?: ArrayOf<FieldDefinition>
      to?: ReferenceTo
    }

  export type ImageMetadataType = 'blurhash' | 'lqip' | 'palette' | 'exif' | 'location'

  export type FieldsetDefinition = {
    name: string
    title?: string
    description?: string
    hidden?: ConditionalProperty
    readOnly?: ConditionalProperty
    options?: ObjectOptions
  }

  export type FieldGroupDefinition = {
    name: string
    title?: string
    icon?: React.ComponentType | React.ReactNode
    default?: boolean
  }

  export interface BaseDefinitionOptions {
    name: string
    title?: string
    description?: string
    hidden?: ConditionalProperty
    readOnly?: ConditionalProperty
    icon?: React.ComponentType | React.ReactNode
    components?: {
      diff?: React.ComponentType<any> // @todo: use `DiffProps` here
      field?: React.ComponentType<any> // @todo: use `FieldProps` here
      input?: React.ComponentType<any> // @todo: use `InputProps` here
      item?: React.ComponentType<any> // @todo: use `ItemProps` here
      preview?: React.ComponentType<any> // @todo: use `PreviewProps` here
    }
    validation?: unknown
    initialValue?: unknown
  }

  /*  export type DefineOptions<T extends string> = T extends 'array'
    ? ArrayOptions
    : T extends 'block'
    ? BlockOptions
    : T extends 'boolean'
    ? BooleanOptions
    : T extends 'date'
    ? DateOptions
    : T extends 'datetime'
    ? DatetimeOptions
    : T extends 'file'
    ? FileOptions
    : T extends 'image'
    ? ImageOptions
    : T extends 'number'
    ? NumberOptions
    : T extends 'object'
    ? ObjectOptions
    : T extends 'reference'
    ? ReferenceOptions
    : T extends 'crossDatasetReference'
    ? CrossDatasetReferenceDefinition
    : T extends 'slug'
    ? SlugOptions
    : T extends 'string'
    ? StringOptions
    : never*/

  export interface ArrayOptions<TValue = unknown> {
    sortable?: boolean
    layout?: 'tags' | 'grid'
    list?: Array<{title: string; value: TValue} | string>
    modal?: {type?: 'dialog' | 'popover'; width?: number | 'auto'}
  }

  export interface ArrayRule<Value> extends RuleDef<ArrayRule<Value>, Value> {
    min: (length: number) => ArrayRule<Value>
    max: (length: number) => ArrayRule<Value>
    length: (length: number) => ArrayRule<Value>
    unique: () => ArrayRule<Value>
  }

  export type ArrayDefinition = StringArrayDefinition | ObjectArrayDefinition

  interface ArrayDefBase extends BaseDefinitionOptions {
    type: 'array'
  }

  export type ArrayTypeDefinition<TType extends Exclude<Type, 'string'> = Exclude<Type, 'string'>> =
    IntrinsicTypeDefinition[TType] | TypeAliasDefinition<TType, undefined>

  type ArrayOf<T> = (Omit<T, 'name' | 'options' | 'validation' | 'hidden'> & {name?: string})[]

  export interface ObjectArrayDefinition extends ArrayDefBase {
    of: ArrayOf<ArrayTypeDefinition>
    initialValue?: InitialValueProperty<any, any[]>
    validation?: ValidationBuilder<ArrayRule<any[]>, any[]>
    options?: ArrayOptions
  }

  export interface StringArrayDefinition extends ArrayDefBase {
    of: ArrayOf<StringDefinition>
    initialValue?: InitialValueProperty<any, string[]>
    validation?: ValidationBuilder<ArrayRule<string[]>, string[]>
    options?: ArrayOptions<string>
  }

  export interface BlockOptions {
    spellCheck?: boolean
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface BlockRule extends RuleDef<BlockRule, any[]> {}

  export interface BlockDefinition extends BaseDefinitionOptions {
    type: 'block'
    styles?: Array<{title: string; value: string}>
    lists?: Array<{title: string; value: string}>
    marks?: MarksDefinition
    of?: Array<TypeDefinition | TypeReference>
    initialValue?: InitialValueProperty<any, any[]>
    options?: BlockOptions
    validation?: ValidationBuilder<BlockRule, any[]>
  }

  export interface DecoratorDefinition {
    title: string
    value: string
    blockEditor?: {
      icon?: () => ReactNode
      render?: (props: {children: ReactNode}) => ReactNode
    }
  }

  export interface MarksDefinition {
    decorators?: DecoratorDefinition[]
    annotations?: Array<TypeDefinition | TypeReference>[]
  }

  export interface BooleanOptions {
    layout?: 'switch' | 'checkbox'
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface BooleanRule extends RuleDef<BooleanRule, boolean> {}

  export interface BooleanDefinition extends BaseDefinitionOptions {
    type: 'boolean'
    options?: BooleanOptions
    initialValue?: InitialValueProperty<any, boolean>
    validation?: ValidationBuilder<BooleanRule, boolean>
  }

  export interface DateOptions {
    calendarTodayLabel?: string
    dateFormat?: string
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DateRule extends RuleDef<DateRule, string> {}

  export interface DateDefinition extends BaseDefinitionOptions {
    type: 'date'
    options?: DateOptions
    placeholder?: string
    validation?: ValidationBuilder<DateRule, string>
    initialValue?: InitialValueProperty<any, string>
  }

  export interface DatetimeOptions {
    calendarTodayLabel?: string
    dateFormat?: string
    timeFormat?: string
    timeStep?: number
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DatetimeRule extends RuleDef<DatetimeRule, string> {
    /**
     * @param minDate - Minimum date (inclusive). minDate should be in ISO 8601 format.
     */
    min: (minDate: string) => DatetimeRule
    /**
     * @param maxDate - Maximum date (inclusive). maxDate should be in ISO 8601 format.
     */
    max: (maxDate: string) => DatetimeRule
  }

  export interface DatetimeDefinition extends BaseDefinitionOptions {
    type: 'datetime'
    options?: DatetimeOptions
    placeholder?: string
    validation?: ValidationBuilder<DatetimeRule, string>
    initialValue?: InitialValueProperty<any, string>
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DocumentOptions {}

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DocumentRule extends RuleDef<DocumentRule, SanityDocument> {}

  export interface DocumentDefinition extends Omit<ObjectDefinition, 'type'> {
    type: 'document'
    liveEdit?: boolean
    orderings?: SortOrdering[]
    options?: DocumentOptions
    validation?: ValidationBuilder<DocumentRule, SanityDocument>
    initialValue?: InitialValueProperty<any, Record<string, unknown>>
  }

  export interface FileOptions extends ObjectOptions {
    storeOriginalFilename?: boolean
    accept?: string
    sources?: AssetSource[]
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface FileRule extends RuleDef<FileRule, FileValue> {}

  export interface FileValue {
    asset?: {
      _type?: 'reference'
      _ref?: string
    }
    [index: string]: unknown
  }

  export interface FileDefinition extends Omit<ObjectDefinition, 'type' | 'fields' | 'options'> {
    type: 'file'
    fields?: ObjectDefinition['fields']
    options?: FileOptions
    validation?: ValidationBuilder<FileRule>
    initialValue?: InitialValueProperty<any, FileValue>
  }

  export interface GeopointValue {
    lat?: number
    lng?: number
    alt?: number
    [index: string]: unknown
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface GeopointRule extends RuleDef<GeopointRule, GeopointValue> {}

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface GeopointOptions {}

  export interface GeopointDefinition extends BaseDefinitionOptions {
    type: 'geopoint'
    options?: GeopointOptions
    validation?: ValidationBuilder<GeopointRule, GeopointValue>
    initialValue?: InitialValueProperty<any, GeopointValue>
  }

  interface AssetFieldOptions {
    /**
     * @deprecated This is now the default behavior - use `fieldset` to hide fields by default
     */
    isHighlighted?: boolean
  }

  export type AssetFieldDefinition = FieldDefinition & {
    options?: AssetFieldOptions
  }

  export interface ImageOptions extends FileOptions {
    metadata?: ImageMetadataType[]
    hotspot?: boolean
  }

  export interface ImageValue extends FileValue {
    crop?: {
      top?: number
      bottom?: number
      left?: number
      right?: number
    }
    hotspot?: {
      x?: number
      y?: number
      height: number
      width: number
    }
    [index: string]: unknown
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ImageRule extends RuleDef<ImageRule, ImageValue> {}

  export interface ImageDefinition extends Omit<ObjectDefinition, 'type' | 'fields' | 'options'> {
    type: 'image'
    fields?: AssetFieldDefinition[]
    metadata?: ImageMetadataType[]
    hotspot?: boolean
    options?: ImageOptions
    validation?: ValidationBuilder<ImageRule, ImageValue>
    initialValue?: InitialValueProperty<any, ImageValue>
  }

  export interface NumberOptions {
    list?: Array<number | {title: string; value: number}>
    layout?: 'radio' | 'dropdown'
    direction?: 'horizontal' | 'vertical'
  }

  export interface NumberRule extends RuleDef<NumberRule, number> {
    min: (minNumber: number) => NumberRule
    max: (maxNumber: number) => NumberRule
    lessThan: (limit: number) => NumberRule
    greaterThan: (limit: number) => NumberRule
    integer: () => NumberRule
    precision: (limit: number) => NumberRule
    positive: () => NumberRule
    negative: () => NumberRule
  }

  export interface NumberDefinition extends BaseDefinitionOptions {
    type: 'number'
    options?: NumberOptions
    validation?: ValidationBuilder<NumberRule, number>
    initialValue?: InitialValueProperty<any, number>
  }

  export interface ObjectOptions {
    collapsible?: boolean
    collapsed?: boolean
    columns?: number
    modal?: {
      type?: 'dialog' | 'popover'
      width?: number | number[] | 'auto'
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ObjectRule extends RuleDef<ObjectRule, Record<string, unknown>> {}

  export interface ObjectDefinition extends BaseDefinitionOptions {
    type: 'object'
    fields: FieldDefinition[]
    groups?: FieldGroupDefinition[]
    fieldsets?: FieldsetDefinition[]
    preview?: PreviewConfig

    options?: ObjectOptions
    validation?: ValidationBuilder<ObjectRule, Record<string, unknown>>
    initialValue?: InitialValueProperty<any, Record<string, unknown>>
  }

  export interface ReferenceValue {
    _ref?: string
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ReferenceRule extends RuleDef<ReferenceRule, ReferenceValue> {}

  export type ReferenceTo = TypeDefinition | TypeReference | Array<TypeDefinition | TypeReference>

  export interface ReferenceDefinition extends BaseDefinitionOptions {
    type: 'reference'
    to: ReferenceTo
    weak?: boolean
    options?: ReferenceOptions
    validation?: ValidationBuilder<ReferenceRule, ReferenceValue>
    initialValue?: InitialValueProperty<any, ReferenceValue>
  }

  export interface CrossDatasetReferenceDefinition extends BaseDefinitionOptions {
    type: 'crossDatasetReference'
    weak?: boolean
    to: {
      type: string
      title?: string
      icon?: ComponentType
      preview?: PreviewConfig
      // eslint-disable-next-line camelcase
      __experimental_search?: {path: string | string[]; weight?: number; mapWith?: string}[]
    }[]

    dataset: string
    projectId: string
    studioUrl?: (document: {id: string; type?: string}) => string | null
    tokenId: string
    options?: ReferenceOptions
  }

  export interface SlugValue {
    current?: string
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface SlugRule extends RuleDef<SlugRule, SlugValue> {}

  export interface SlugDefinition extends BaseDefinitionOptions {
    type: 'slug'
    options?: SlugOptions
    validation?: ValidationBuilder<SlugRule, SlugValue>
    initialValue?: InitialValueProperty<any, SlugValue>
  }

  export interface StringOptions {
    list?: Array<string | {title: string; value: string}>
    layout?: 'radio' | 'dropdown'
    direction?: 'vertical' | 'horizontal'
  }

  export interface StringRule extends RuleDef<StringRule, string> {
    min: (minNumber: number) => StringRule
    max: (maxNumber: number) => StringRule
    length: (exactLength: number) => StringRule
    uppercase: () => StringRule
    lowercase: () => StringRule
    regex(pattern: RegExp, name: string, options: {name?: string; invert?: boolean}): StringRule
    regex(pattern: RegExp, options: {name?: string; invert?: boolean}): StringRule
    regex(pattern: RegExp, name: string): StringRule
    regex(pattern: RegExp): StringRule
  }

  export interface StringDefinition extends BaseDefinitionOptions {
    type: 'string'
    options?: StringOptions
    validation?: ValidationBuilder<StringRule, string>
    initialValue?: InitialValueProperty<any, string>
  }

  export interface SpanDefinition extends BaseDefinitionOptions {
    type: 'span'
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface TextRule extends StringRule {}

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface TextOptions extends StringOptions {}

  export interface TextDefinition extends BaseDefinitionOptions {
    type: 'text'
    rows?: number
    options: TextOptions
    validation?: ValidationBuilder<TextRule, string>
    initialValue?: InitialValueProperty<any, string>
  }

  export interface UrlRule extends RuleDef<UrlRule, string> {
    uri(options: UriValidationOptions): UrlRule
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface UrlOptions {}

  export interface UrlDefinition extends BaseDefinitionOptions {
    type: 'url'
    options?: UrlOptions
    validation?: ValidationBuilder<UrlRule, string>
    initialValue?: InitialValueProperty<any, string>
  }
}

type MaybeUnknownProps<TStrict extends boolean | undefined> = TStrict extends false
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

interface DefineOptions<
  TStrict extends boolean | undefined,
  TAlias extends Schema.Type | undefined
> {
  /**
   * `strict: false` allows unknown properties in the schema.
   * Use this when adding customizations to the schema that are not part of sanity core
   */
  strict?: TStrict
  /** Should be provided when type is a non-intrinisic type, ie type is a type alias*/
  alias?: Schema.NarrowType<TAlias>
}

export function defineType<
  TType extends string,
  TArrayType extends string | undefined,
  TSelect extends Record<string, string> | undefined,
  TPrepareValue extends Record<keyof TSelect, any> | undefined,
  TName extends string,
  TAlias extends Schema.Type | undefined,
  TStrict extends boolean | undefined
>(
  schemaDefinition: {
    type: TType
    name: TName
    of?: {type: TArrayType}[]
    preview?: MaybePreview<TSelect, TPrepareValue>
  } & Omit<Schema.InferSchemaDef<TType, TAlias, TArrayType>, 'preview'> &
    MaybeUnknownProps<TStrict>,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defineOptions?: DefineOptions<TStrict, TAlias>
): Omit<Schema.InferSchemaDef<TType, TAlias, TArrayType>, 'preview'> & {
  name: TName
  preview?: MaybePreview<TSelect, TPrepareValue>
} {
  return schemaDefinition
}

export function defineField<
  TType extends string,
  TArrayType extends string | undefined,
  TName extends string,
  TStrict extends boolean | undefined,
  TAlias extends Schema.Type | undefined
>(
  schemaField: {
    type: TType
    name: TName
    of?: {type: TArrayType}[]
  } & Schema.InferSchemaDef<TType, TAlias, TArrayType> &
    Schema.FieldBase &
    MaybeUnknownProps<TStrict>,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defineOptions?: DefineOptions<TStrict, TAlias>
): Schema.InferSchemaDef<TType, TAlias, TArrayType> &
  Schema.FieldBase & {
    name: TName
    // type erease these on the way out to be compatible with FieldDefinition
    validation?: SchemaValidationValue
    initialValue?: InitialValueProperty<any, any>
  } {
  return schemaField
}

/**
 * Note: you probably want `SchemaTypeDefinition` instead
 * @see SchemaTypeDefinition
 */
export type SchemaType =
  | ArraySchemaType
  | BooleanSchemaType
  | FileSchemaType
  | NumberSchemaType
  | ObjectSchemaType
  | StringSchemaType
  | ReferenceSchemaType

/**
 * Represents a Sanity schema type definition with an optional type parameter.
 *
 * It's recommend to use the `defineType` helper instead of this type by
 * itself.
 */
export type SchemaTypeDefinition<TType extends Schema.Type = Schema.Type> =
  Schema.TypeDefinition<TType>

export interface SchemaValidationError {
  helpId?: string
  message: string
  severity: 'error'
}

export interface SchemaValidationWarning {
  helpId?: string
  message: string
  severity: 'warning'
}

export type SchemaValidationProblem = SchemaValidationError | SchemaValidationWarning

export type SchemaValidationProblemPath = Array<
  {kind: 'type'; type: string; name: string} | {kind: 'property'; name: string}
>

export interface SchemaValidationProblemGroup {
  path: SchemaValidationProblemPath
  problems: SchemaValidationProblem[]
}

export interface Schema {
  _original?: {
    name: string
    types: SchemaTypeDefinition[]
  }
  _registry: {[typeName: string]: any}
  _validation?: SchemaValidationProblemGroup[]
  name: string
  get: (name: string) => SchemaType | undefined
  has: (name: string) => boolean
  getTypeNames: () => string[]
}

export interface SortOrderingItem {
  field: string
  direction: 'asc' | 'desc'
}

export type SortOrdering = {
  title: string
  name: string
  by: SortOrderingItem[]
}
export interface ConditionalPropertyCallbackContext {
  document: SanityDocument | undefined
  // `any` should be fine here. leaving this as `unknown` would cause more
  // friction for end users
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parent: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
  currentUser: Omit<CurrentUser, 'role'> | null
}

export type ConditionalPropertyCallback = (context: ConditionalPropertyCallbackContext) => boolean
export type ConditionalProperty = boolean | ConditionalPropertyCallback | undefined

export interface InitialValueResolverContext {
  projectId: string
  dataset: string
  schema: Schema
  currentUser: CurrentUser | null
  client: SanityClient
}

export type InitialValueResolver<Params, Value> = (
  params: Params | undefined,
  context: InitialValueResolverContext
) => Promise<Value> | Value
export type InitialValueProperty<Params, Value> =
  | Value
  | InitialValueResolver<Params, Value>
  | undefined

/**
 * Represents the possible values of a schema type's `validation` field.
 *
 * If the schema has not been run through `inferFromSchema` from
 * `@sanity/validation` then value could be a function.
 *
 * `inferFromSchema` mutates the schema converts this value to an array of
 * `Rule` instances.
 *
 * @privateRemarks
 *
 * Usage of the schema inside the studio will almost always be from the compiled
 * `createSchema` function. In this case, you can cast the value or throw to
 * narrow the type. E.g.:
 *
 * ```ts
 * if (typeof type.validation === 'function') {
 *   throw new Error(
 *     `Schema type "${type.name}"'s \`validation\` was not run though \`inferFromSchema\``
 *   )
 * }
 * ```
 */
export type SchemaValidationValue =
  | false
  | undefined
  | Rule
  | SchemaValidationValue[]
  | ((rule: Rule) => SchemaValidationValue)

export interface BaseSchemaType {
  name: string
  title?: string
  description?: string
  type?: SchemaType
  liveEdit?: boolean
  readOnly?: ConditionalProperty
  hidden?: ConditionalProperty
  icon?: ComponentType
  initialValue?: InitialValueProperty<any, any>
  validation?: SchemaValidationValue
  preview?: PreviewConfig
  components?: {
    diff?: React.ComponentType<any> // @todo: use `DiffProps` here
    field?: React.ComponentType<any> // @todo: use `FieldProps` here
    input?: React.ComponentType<any> // @todo: use `InputProps` here
    item?: React.ComponentType<any> // @todo: use `ItemProps` here
    preview?: React.ComponentType<any> // @todo: use `PreviewProps` here
  }

  /**
   * @deprecated This will be removed.
   */
  placeholder?: string
}

export interface TitledListValue<V = unknown> {
  _key?: string
  title: string
  value?: V
}

export interface EnumListProps<V = unknown> {
  list?: TitledListValue<V>[] | V[]
  layout?: 'radio' | 'dropdown'
  direction?: 'horizontal' | 'vertical'
}

export interface StringSchemaType extends BaseSchemaType {
  jsonType: 'string'
  options?: EnumListProps<string> & {
    // Actually just part of date time, but can't find a good way to differentiate
    dateFormat?: string
    timeFormat?: string
  }
  initialValue?: ((arg?: any) => Promise<string> | string) | string | undefined
}

export interface TextSchemaType extends StringSchemaType {
  rows?: number
}

export interface NumberSchemaType extends BaseSchemaType {
  jsonType: 'number'
  options?: EnumListProps<number>
  initialValue?: InitialValueProperty<any, number>
}

export interface BooleanSchemaType extends BaseSchemaType {
  jsonType: 'boolean'
  options?: {
    layout: 'checkbox' | 'switch'
  }
  initialValue?: InitialValueProperty<any, boolean>
}

export interface ArraySchemaType<V = unknown> extends BaseSchemaType {
  jsonType: 'array'
  of: (Exclude<SchemaType, ArraySchemaType> | ReferenceSchemaType)[]
  options?: {
    list?: TitledListValue<V>[] | V[]
    layout?: V extends string ? 'tags' : 'grid'
    direction?: 'horizontal' | 'vertical'
    sortable?: boolean
    modal?: {type?: 'dialog' | 'popover'; width?: number | 'auto'}
  }
}

// Note: this would ideally be a type parameter in `ArraySchemaType` however
// adding one conflicts with the existing definition.
export type ArraySchemaTypeOf<TSchemaType extends ArraySchemaType['of'][number]> = Omit<
  ArraySchemaType,
  'of'
> & {of: TSchemaType[]}

/**
 * A specific `ObjectField` for `marks` in `SpanSchemaType`
 * @see SpanSchemaType
 */
export type MarksObjectField = {name: 'marks'} & ObjectField<ArraySchemaTypeOf<StringSchemaType>>

/**
 * A specific `ObjectField` for `text` in `SpanSchemaType`
 * @see SpanSchemaType
 */
export type TextObjectField = {name: 'text'} & ObjectField<TextSchemaType>

/**
 * A specific `ObjectField` for `style` in `BlockSchemaType`
 * @see BlockSchemaType
 */
export type StyleObjectField = {name: 'style'} & ObjectField<StringSchemaType>

/**
 * A specific `ObjectField` for `list` in `BlockSchemaType`
 * @see BlockSchemaType
 */
export type ListObjectField = {name: 'list'} & ObjectField<StringSchemaType>

/**
 * The specific `children` field of a `block` type (`BlockSchemaType`)
 * @see BlockSchemaType
 */
export type BlockChildrenObjectField = {name: 'children'} & ObjectField<ArraySchemaType>

/**
 * Represents the compiled schema shape for `span`s for portable text.
 *
 * Note: this does _not_ represent the schema definition shape.
 */
export interface SpanSchemaType extends Omit<ObjectSchemaType, 'fields'> {
  annotations: (ObjectSchemaType & {
    blockEditor?: {
      icon?: string | ComponentType
      render?: ComponentType
    }
  })[]
  decorators: TitledListValue<string>[]
  // the first field will always be the `marks` field and the second will
  // always be the `text` field
  fields: [MarksObjectField, TextObjectField]
}

/**
 * Represents the compiled schema shape for `block`s for portable text.
 *
 * Note: this does _not_ represent the schema definition shape.
 */
export interface BlockSchemaType extends ObjectSchemaType {
  fields: [
    // the first 3 field are always block children, styles, and lists
    BlockChildrenObjectField,
    StyleObjectField,
    ListObjectField,
    // then it could be any additional fields the user could add
    ...ObjectField[]
  ]
}

export interface SlugSchemaType extends ObjectSchemaType {
  jsonType: 'object'
  options?: SlugOptions
}

export type ObjectFieldType<T extends SchemaType = SchemaType> = T & {
  hidden?: ConditionalProperty
  readOnly?: ConditionalProperty
}

export interface ObjectField<T extends SchemaType = SchemaType> {
  name: string
  fieldset?: string
  group?: string | string[]
  type: ObjectFieldType<T>
}
export interface FieldGroup {
  name: string
  icon?: React.ComponentType
  title?: string
  description?: string
  hidden?: ConditionalProperty
  default?: boolean
  fields?: ObjectField[]
}

export interface ObjectSchemaType extends BaseSchemaType {
  jsonType: 'object'
  fields: ObjectField[]
  groups?: FieldGroup[]
  fieldsets?: Fieldset[]
  initialValue?: InitialValueProperty<any, Record<string, unknown>>
  weak?: boolean

  // Experimentals
  // Note: `path` is a string in the _specification_, but converted to a
  // string array in the schema normalization/compilation step
  // eslint-disable-next-line camelcase
  __experimental_search?: {path: string[]; weight: number; mapWith?: string}[]

  /**
   * @beta
   */
  orderings?: SortOrdering[]

  // @todo
  options?: any
}

export interface ObjectSchemaTypeWithOptions extends Omit<ObjectSchemaType, 'options'> {
  options?: CollapseOptions & {
    columns?: number
  }
}

export interface SingleFieldSet {
  single: true
  field: ObjectField
  hidden?: ConditionalProperty
  readOnly?: ConditionalProperty
  group?: string | string[]
}

export interface MultiFieldSet {
  name: string
  title?: string
  description?: string
  single?: false
  group?: string | string[]
  options?: CollapseOptions & {
    columns?: number
  }
  fields: ObjectField[]
  hidden?: ConditionalProperty
  readOnly?: ConditionalProperty
}

export type Fieldset = SingleFieldSet | MultiFieldSet

export interface CollapseOptions {
  collapsed?: boolean

  collapsible?: boolean

  /**
   * @deprecated Use `collapsible` instead
   */
  collapsable?: boolean
}

export interface ReferenceSchemaType extends Omit<ObjectSchemaType, 'options'> {
  jsonType: 'object'
  to: ObjectSchemaType[]
  weak?: boolean
  options?: ReferenceOptions
}

export interface AssetSchemaTypeOptions {
  accept?: string
  storeOriginalFilename?: boolean
}

export interface FileSchemaType extends Omit<ObjectSchemaType, 'options'> {
  options?: AssetSchemaTypeOptions & {
    sources?: AssetSource[]
  }
}

export interface ImageSchemaType extends Omit<ObjectSchemaType, 'options'> {
  options?: AssetSchemaTypeOptions & {
    hotspot?: boolean
    metadata?: ('exif' | 'location' | 'lqip' | 'palette' | 'blurhash')[]
    sources?: AssetSource[]
  }
}
