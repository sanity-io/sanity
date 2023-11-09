import type {ComponentType} from 'react'
import type {SanityClient} from '@sanity/client'
import type {Rule} from '../validation'
import type {SanityDocument} from '../documents'
import type {CurrentUser} from '../user'
import type {PreviewConfig} from './preview'
import type {SchemaTypeDefinition} from './definition/schemaDefinition'
import type {ArrayOptions} from './definition/type/array'
import type {
  BlockDecoratorDefinition,
  BlockOptions,
  BooleanOptions,
  DateOptions,
  DatetimeOptions,
  FileOptions,
  ImageOptions,
  NumberOptions,
  ReferenceOptions,
  SlugOptions,
  StringOptions,
  TextOptions,
} from './definition/type'

export {defineType, defineField, defineArrayMember, typed} from './define'

/**
 * Note: you probably want `SchemaTypeDefinition` instead
 * @see SchemaTypeDefinition
 *
 * @public
 */
export type SchemaType =
  | ArraySchemaType
  | BooleanSchemaType
  | FileSchemaType
  | NumberSchemaType
  | ObjectSchemaType
  | StringSchemaType
  | ReferenceSchemaType

/** @public */
export interface SchemaValidationError {
  helpId?: string
  message: string
  severity: 'error'
}

/** @internal */
export interface SchemaValidationWarning {
  helpId?: string
  message: string
  severity: 'warning'
}

/** @internal */
export type SchemaValidationProblem = SchemaValidationError | SchemaValidationWarning

/** @internal */
export type SchemaValidationProblemPath = Array<
  {kind: 'type'; type: string; name: string} | {kind: 'property'; name: string}
>

/** @internal */
export interface SchemaValidationProblemGroup {
  path: SchemaValidationProblemPath
  problems: SchemaValidationProblem[]
}

/** @public */
export interface Schema {
  /** @internal */
  _original?: {
    name: string
    types: SchemaTypeDefinition[]
  }
  /** @internal */
  _registry: {[typeName: string]: any}
  /** @internal */
  _validation?: SchemaValidationProblemGroup[]
  name: string
  get: (name: string) => SchemaType | undefined
  has: (name: string) => boolean
  getTypeNames: () => string[]
}

/** @beta */
export interface SortOrderingItem {
  field: string
  direction: 'asc' | 'desc'
}

/** @beta */
export type SortOrdering = {
  title: string
  name: string
  by: SortOrderingItem[]
}

/** @public */
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

/** @public */
export type ConditionalPropertyCallback = (context: ConditionalPropertyCallbackContext) => boolean

/** @public */
export type ConditionalProperty = boolean | ConditionalPropertyCallback | undefined

/** @public */
export interface InitialValueResolverContext {
  projectId: string
  dataset: string
  schema: Schema
  currentUser: CurrentUser | null
  getClient: (options: {apiVersion: string}) => SanityClient
}

/** @public */
export type InitialValueResolver<Params, Value> = (
  params: Params | undefined,
  context: InitialValueResolverContext,
) => Promise<Value> | Value

/** @public */
export type InitialValueProperty<Params, Value> =
  | Value
  | InitialValueResolver<Params, Value>
  | undefined

/**
 * Represents the possible values of a schema type's `validation` field.
 *
 * If the schema has not been run through `inferFromSchema` from
 * `sanity/validation` then value could be a function.
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
 *
 * @public
 */
export type SchemaValidationValue =
  | false
  | undefined
  | Rule
  | SchemaValidationValue[]
  | ((rule: Rule) => SchemaValidationValue)

/** @public */
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

  /** @beta */
  components?: {
    block?: ComponentType<any>
    inlineBlock?: ComponentType<any>
    annotation?: ComponentType<any>
    diff?: ComponentType<any>
    field?: ComponentType<any>
    input?: ComponentType<any>
    item?: ComponentType<any>
    preview?: ComponentType<any>
  }

  /**
   * @deprecated This will be removed.
   */
  placeholder?: string
}

/**
 * This is used for string, text, date and datetime.
 * This interface represent the compiled version at runtime, when accessed through Schema.
 *
 * @public
 */
export interface StringSchemaType extends BaseSchemaType {
  jsonType: 'string'
  options?: StringOptions & TextOptions & DateOptions & DatetimeOptions
  initialValue?: InitialValueProperty<any, string>
}

/** @public */
export interface TextSchemaType extends StringSchemaType {
  rows?: number
}

/** @public */
export interface NumberSchemaType extends BaseSchemaType {
  jsonType: 'number'
  options?: NumberOptions
  initialValue?: InitialValueProperty<any, number>
}

/** @public */
export interface BooleanSchemaType extends BaseSchemaType {
  jsonType: 'boolean'
  options?: BooleanOptions
  initialValue?: InitialValueProperty<any, boolean>
}

/** @public */
export interface ArraySchemaType<V = unknown> extends BaseSchemaType {
  jsonType: 'array'
  of: (Exclude<SchemaType, ArraySchemaType> | ReferenceSchemaType)[]
  options?: ArrayOptions<V> & {layout?: V extends string ? 'tag' : 'grid'}
}

// Note: this would ideally be a type parameter in `ArraySchemaType` however
// adding one conflicts with the existing definition.
/** @internal */
export type ArraySchemaTypeOf<TSchemaType extends ArraySchemaType['of'][number]> = Omit<
  ArraySchemaType,
  'of'
> & {of: TSchemaType[]}

/**
 * A specific `ObjectField` for `marks` in `SpanSchemaType`
 * @see SpanSchemaType
 *
 * @internal
 */
export type SpanMarksObjectField = {name: 'marks'} & ObjectField<
  ArraySchemaTypeOf<StringSchemaType>
>

/**
 * A specific `ObjectField` for `text` in `SpanSchemaType`
 * @see SpanSchemaType
 *
 * @internal
 */
export type SpanTextObjectField = {name: 'text'} & ObjectField<TextSchemaType>

/**
 * A specific `ObjectField` for `style` in `BlockSchemaType`
 * @see BlockSchemaType
 *
 * @internal
 */
export type BlockStyleObjectField = {name: 'style'} & ObjectField<StringSchemaType>

/**
 * A specific `ObjectField` for `list` in `BlockSchemaType`
 * @see BlockSchemaType
 *
 * @internal
 */
export type BlockListObjectField = {name: 'list'} & ObjectField<StringSchemaType>

/**
 * The specific `children` field of a `block` type (`BlockSchemaType`)
 * @see BlockSchemaType
 *
 * @internal
 */
export type BlockChildrenObjectField = {name: 'children'} & ObjectField<ArraySchemaType>

/**
 * Represents the compiled schema shape for `span`s for portable text.
 *
 * Note: this does _not_ represent the schema definition shape.
 *
 * @internal
 */
export interface SpanSchemaType extends Omit<ObjectSchemaType, 'fields'> {
  annotations: (ObjectSchemaType & {
    icon?: string | ComponentType
    components?: {
      item?: ComponentType
    }
  })[]
  decorators: BlockDecoratorDefinition[]
  // the first field will always be the `marks` field and the second will
  // always be the `text` field
  fields: [SpanMarksObjectField, SpanTextObjectField]
}

/**
 * Represents the compiled schema shape for `block`s for portable text.
 *
 * Note: this does _not_ represent the schema definition shape.
 *
 * @internal
 */
export interface BlockSchemaType extends ObjectSchemaType {
  fields: [
    // the first 3 field are always block children, styles, and lists
    BlockChildrenObjectField,
    BlockStyleObjectField,
    BlockListObjectField,
    // then it could be any additional fields the user could add
    ...ObjectField[],
  ]
  options?: BlockOptions
}

/** @public */
export interface SlugSchemaType extends ObjectSchemaType {
  jsonType: 'object'
  options?: SlugOptions
}

/** @public */
export type ObjectFieldType<T extends SchemaType = SchemaType> = T & {
  hidden?: ConditionalProperty
  readOnly?: ConditionalProperty
}

/** @public */
export interface ObjectField<T extends SchemaType = SchemaType> {
  name: string
  fieldset?: string
  group?: string | string[]
  type: ObjectFieldType<T>
}

/** @public */
export interface FieldGroup {
  name: string
  icon?: ComponentType
  title?: string
  description?: string
  hidden?: ConditionalProperty
  default?: boolean
  fields?: ObjectField[]
}

/** @public */
export interface ObjectSchemaType extends BaseSchemaType {
  jsonType: 'object'
  fields: ObjectField[]
  groups?: FieldGroup[]
  fieldsets?: Fieldset[]
  initialValue?: InitialValueProperty<any, Record<string, unknown>>
  weak?: boolean

  // Experimentals
  // Note: `path` is a string in the _specification_, but converted to a
  // string/number array in the schema normalization/compilation step
  // a path segment is a number when specified like array.0.prop in preview config.
  /** @alpha */
  __experimental_search: {path: (string | number)[]; weight: number; mapWith?: string}[]
  /** @alpha */
  __experimental_omnisearch_visibility?: boolean
  /** @alpha */
  __experimental_actions?: string[]

  /**
   * @beta
   */
  orderings?: SortOrdering[]

  // @todo
  options?: any
}

/** @internal */
export interface ObjectSchemaTypeWithOptions extends Omit<ObjectSchemaType, 'options'> {
  options?: CollapseOptions & {
    columns?: number
  }
}

/** @public */
export interface SingleFieldSet {
  single: true
  field: ObjectField
  hidden?: ConditionalProperty
  readOnly?: ConditionalProperty
  group?: string | string[]
}

/** @public */
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

/** @public */
export type Fieldset = SingleFieldSet | MultiFieldSet

/** @public */
export interface CollapseOptions {
  collapsed?: boolean

  collapsible?: boolean

  /**
   * @deprecated Use `collapsible` instead
   */
  collapsable?: boolean
}

/** @public */
export interface ReferenceSchemaType extends Omit<ObjectSchemaType, 'options'> {
  jsonType: 'object'
  to: ObjectSchemaType[]
  weak?: boolean
  options?: ReferenceOptions
}

/** @public */
export interface AssetSchemaTypeOptions {
  accept?: string
  storeOriginalFilename?: boolean
}

/** @public */
export interface FileSchemaType extends Omit<ObjectSchemaType, 'options'> {
  options?: FileOptions
}

/** @internal */
export interface ImageSchemaType extends Omit<ObjectSchemaType, 'options'> {
  options?: ImageOptions
}
