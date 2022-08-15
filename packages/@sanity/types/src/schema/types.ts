// Note: INCOMPLETE, but it's a start
import type {ComponentType} from 'react'
import type {Rule} from '../validation'
import type {ReferenceOptions} from '../reference'
import type {AssetSource} from '../assets'
import type {SlugOptions} from '../slug'
import type {SanityDocument} from '../documents'
import type {CurrentUser} from '../user'
import type {PreviewConfig} from './preview'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Schema {
  /**
   * The type definitions that are built into the sanity schema
   */
  export type IntrinsicTypeDefinition =
    | ArrayDefinition
    | BlockDefinition
    | BooleanDefinition
    | DateDefinition
    | DatetimeDefinition
    | DocumentDefinition
    | FileDefinition
    | GeopointDefinition
    | ImageDefinition
    | NumberDefinition
    | ObjectDefinition
    | ReferenceDefinition
    | CrossDatasetReferenceDefinition
    | SlugDefinition
    | StringDefinition
    | SpanDefinition
    | TextDefinition
    | UrlDefinition

  /**
   * Represents a Sanity schema type definition.
   *
   * It's recommend to use the `defineType` helper instead of this type by
   * itself.
   */
  export type TypeDefinition<TType extends Type = Type> =
    | Extract<IntrinsicTypeDefinition, {type: TType}>
    | TypeAliasDefinition<TType>

  /**
   * A union of all intrinsic types allowed natively in the schema.
   */
  export type Type = IntrinsicTypeDefinition['type']

  /**
   * Represents a reference to another type registered top-level in your schema.
   */
  export interface TypeReference<TType extends Type = Type> {
    type: string
    name?: string
    options?: TypeOptions<TType> & {[key: string]: unknown}
  }

  /**
   * Represents a type definition that is an alias/extension of an existing type
   * in your schema. Creating a type alias will re-register that existing type
   * under a different name. You can also override the default type options with
   * a type alias definition.
   */
  export interface TypeAliasDefinition<TType extends Type = Type> extends BaseDefinitionOptions {
    type: Exclude<string, Type>
    options?: TypeOptions<TType> & {[key: string]: unknown}
  }

  /**
   * The shape of a field definition. Note, it's recommended to use the
   * `defineField` function instead of using this type directly.
   *
   * A field definition can be a reference to another registered top-level type
   * or a inline inline type definition.
   */
  export type FieldDefinition<TType extends Type = Type> = (
    | Extract<IntrinsicTypeDefinition, {type: TType}>
    | TypeReference<TType>
  ) & {
    name: string
    title?: string
    description?: string
    fieldset?: string
    group?: string | string[]
    hidden?: ConditionalProperty
    readOnly?: ConditionalProperty
    validation?: SchemaValidationValue
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

  interface BaseDefinitionOptions {
    name: string
    title?: string
    description?: string
    hidden?: ConditionalProperty
    readOnly?: ConditionalProperty
    validation?: SchemaValidationValue
    icon?: React.ComponentType | React.ReactNode
    components?: {
      field?: React.ComponentType<any> // @todo: use `FieldProps` here
      item?: React.ComponentType<any> // @todo: use `ItemProps` here
      input?: React.ComponentType<any> // @todo: use `InputProps` here
      preview?: React.ComponentType<any> // @todo: use `PreviewProps` here
    }
    // TODO
    initialValue?: any
  }

  export type TypeOptions<T extends Type> = T extends 'array'
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
    : never

  export interface ArrayOptions<TValue = unknown> {
    sortable?: boolean
    layout?: 'tags' | 'grid'
    list?: Array<{title: string; value: TValue} | string>
    modal?: {type?: 'dialog' | 'popover'; width?: number | 'auto'}
  }

  export interface ArrayDefinition<TValue = unknown> extends BaseDefinitionOptions {
    type: 'array'
    of: Array<TypeDefinition | TypeReference>

    options?: ArrayOptions<TValue>
  }

  export interface BlockOptions {
    spellCheck?: boolean
  }

  export interface BlockDefinition extends BaseDefinitionOptions {
    type: 'block'
    styles?: Array<{title: string; value: string}>
    lists?: Array<{title: string; value: string}>
    // TODO
    marks?: unknown
    of?: Array<TypeDefinition | TypeReference>
    options?: BlockOptions
  }

  export interface BooleanOptions {
    layout?: 'switch' | 'checkbox'
  }

  export interface BooleanDefinition extends BaseDefinitionOptions {
    type: 'boolean'
    options?: BooleanOptions
  }

  export interface DateOptions {
    calendarTodayLabel?: string
    dateFormat?: string
  }

  export interface DateDefinition extends BaseDefinitionOptions {
    type: 'date'
    options?: DateOptions
    placeholder?: string
  }

  export interface DatetimeOptions {
    calendarTodayLabel?: string
    dateFormat?: string
    timeFormat?: string
    timeStep?: number
  }

  export interface DatetimeDefinition extends BaseDefinitionOptions {
    type: 'datetime'
    options?: DatetimeOptions
    placeholder?: string
  }

  export interface DocumentDefinition extends Omit<ObjectDefinition, 'type'> {
    type: 'document'
    liveEdit?: boolean
    orderings?: SortOrdering[]
  }

  export interface FileOptions extends ObjectOptions {
    storeOriginalFilename?: boolean
    accept?: string
    sources?: AssetSource[]
  }

  export interface FileDefinition extends Omit<ObjectDefinition, 'type' | 'fields' | 'options'> {
    type: 'file'
    fields?: ObjectDefinition['fields']
    options?: FileOptions
  }

  export interface GeopointDefinition extends BaseDefinitionOptions {
    type: 'geopoint'
  }

  interface AssetFieldOptions {
    /**
     * @deprecated This is now the default behavior - use `fieldset` to hide fields by default
     */
    isHighlighted?: boolean
  }

  export type AssetFieldDefinition<TType extends Type = Type> = FieldDefinition<TType> & {
    options?: AssetFieldOptions
  }

  export interface ImageOptions extends FileOptions {
    metadata?: ImageMetadataType[]
    hotspot?: boolean
  }

  export interface ImageDefinition extends Omit<ObjectDefinition, 'type' | 'fields' | 'options'> {
    type: 'image'
    fields?: AssetFieldDefinition[]
    metadata?: ImageMetadataType[]
    hotspot?: boolean
    options?: ImageOptions
  }

  export interface NumberOptions {
    list?: Array<number | {title: string; value: number}>
    layout?: 'radio' | 'dropdown'
    direction?: 'horizontal' | 'vertical'
  }

  export interface NumberDefinition extends BaseDefinitionOptions {
    type: 'number'
    options?: NumberOptions
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

  export interface ObjectDefinition extends BaseDefinitionOptions {
    type: 'object'
    fields: FieldDefinition[]
    groups?: FieldGroupDefinition[]
    fieldsets?: FieldsetDefinition[]
    preview?: PreviewConfig

    options?: ObjectOptions
  }

  export interface ReferenceDefinition extends BaseDefinitionOptions {
    type: 'reference'
    to: TypeDefinition | TypeReference | Array<TypeDefinition | TypeReference>
    weak?: boolean
    options?: ReferenceOptions
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

  export interface SlugDefinition extends BaseDefinitionOptions {
    type: 'slug'
    options?: SlugOptions
  }

  export interface StringOptions {
    list?: Array<string | {title: string; value: string}>
    layout?: 'radio' | 'dropdown'
    direction?: 'vertical' | 'horizontal'
  }

  export interface StringDefinition extends BaseDefinitionOptions {
    type: 'string'
    options?: StringOptions
  }

  export interface SpanDefinition extends BaseDefinitionOptions {
    type: 'span'
  }

  export interface TextDefinition extends BaseDefinitionOptions {
    type: 'text'
    rows?: number
  }

  export interface UrlDefinition extends BaseDefinitionOptions {
    type: 'url'
  }
}

export function defineType<TType extends string>(
  schemaDefinition: Schema.TypeAliasDefinition
): Schema.TypeAliasDefinition

export function defineType<TType extends Schema.Type>(
  schemaDefinition: Extract<Schema.IntrinsicTypeDefinition, {type: TType}>
): Extract<Schema.IntrinsicTypeDefinition, {type: TType}>

export function defineType<TType extends Schema.Type>(
  schemaDefinition: Schema.TypeDefinition<TType>
): Schema.TypeDefinition<TType> {
  return schemaDefinition
}

export function defineField<TType extends Schema.Type>(
  schemaField: Schema.FieldDefinition<TType>
): Schema.FieldDefinition<TType> {
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

export type InitialValueResolver<Params, Value> = (params?: Params) => Promise<Value> | Value
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
    field?: React.ComponentType<any> // @todo: use `FieldProps` here
    item?: React.ComponentType<any> // @todo: use `ItemProps` here
    input?: React.ComponentType<any> // @todo: use `InputProps` here
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
