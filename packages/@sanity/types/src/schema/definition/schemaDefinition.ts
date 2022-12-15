import {ComponentType, ReactNode} from 'react'
import {PreviewConfig} from '../preview'
import {InitialValueProperty, SchemaValidationValue} from '../types'
import {
  ArrayDefinition,
  BlockDefinition,
  BooleanDefinition,
  CrossDatasetReferenceDefinition,
  DateDefinition,
  DatetimeDefinition,
  DocumentDefinition,
  FileDefinition,
  GeopointDefinition,
  ImageDefinition,
  NumberDefinition,
  ObjectDefinition,
  ReferenceDefinition,
  SlugDefinition,
  StringDefinition,
  TextDefinition,
  UrlDefinition,
  EmailDefinition,
} from './type'
import {BaseSchemaDefinition} from './type/common'

/**
 * `IntrinsicDefinitions` is a lookup map for "predefined" schema definitions.
 * Schema types in `IntrinsicDefinitions` will have good type-completion and type-safety in {@link defineType},
 * {@link defineField} and {@link defineArrayMember} once the `type` property is provided.
 *
 * By default, `IntrinsicDefinitions` contains all standard Sanity schema types (`array`, `string`, `number` ect),
 * but it is an interface and as such, open for extension.
 *
 * This type can be extended using declaration merging; this way new entries can be added.
 * See {@link defineType} for examples on how this can be accomplished.
 *
 * @see defineType
 *
 * @public
 */
export interface IntrinsicDefinitions {
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
  email: EmailDefinition
}

/**
 * A union of all intrinsic types allowed natively in the schema.
 *
 * @see IntrinsicDefinitions
 *
 * @public
 */
export type IntrinsicTypeName = IntrinsicDefinitions[keyof IntrinsicDefinitions]['type']

/**
 * Represents a Sanity schema type definition with an optional type parameter.
 *
 * It's recommend to use the `defineType` helper instead of this type by
 * itself.
 *
 * @see defineType
 *
 * @public
 */
export type SchemaTypeDefinition<TType extends IntrinsicTypeName = IntrinsicTypeName> =
  | IntrinsicDefinitions[IntrinsicTypeName]
  | TypeAliasDefinition<string, TType>

/**
 * Represents a reference to another type registered top-level in your schema.
 *
 * @public
 */
export interface TypeReference {
  type: string
  name?: string
  icon?: ComponentType | ReactNode
  options?: {[key: string]: unknown}
}

/**
 * Represents a type definition that is an alias/extension of an existing type
 * in your schema. Creating a type alias will re-register that existing type
 * under a different name. You can also override the default type options with
 * a type alias definition.
 *
 * @public
 */
export interface TypeAliasDefinition<
  TType extends string,
  TAlias extends IntrinsicTypeName | undefined
> extends BaseSchemaDefinition {
  type: TType
  options?: TAlias extends IntrinsicTypeName ? IntrinsicDefinitions[TAlias]['options'] : unknown

  validation?: SchemaValidationValue
  initialValue?: InitialValueProperty<any, any>
  preview?: PreviewConfig

  components?: {
    annotation?: ComponentType<any>
    block?: ComponentType<any>
    inlineBlock?: ComponentType<any>
    diff?: ComponentType<any>
    field?: ComponentType<any>
    input?: ComponentType<any>
    item?: ComponentType<any>
    preview?: ComponentType<any>
  }
}

/** @public */
export interface FieldDefinitionBase {
  fieldset?: string
  group?: string | string[]
}

/** @public */
export type InlineFieldDefinition = {
  [K in keyof IntrinsicDefinitions]: Omit<
    IntrinsicDefinitions[K],
    'initialValue' | 'validation'
  > & {
    // widen these so these are not unknown in FieldDefinition arrays due to mutually exclusive unions
    validation?: SchemaValidationValue
    initialValue?: InitialValueProperty<any, any>
  }
}

/**
 * The shape of a field definition. Note, it's recommended to use the
 * `defineField` function instead of using this type directly.
 *
 * Where `defineField` infers the exact field type,
 * FieldDefinition is a compromise union of all types a field can have.
 *
 * A field definition can be a reference to another registered top-level type
 * or a inline type definition.
 *
 * @public
 */
export type FieldDefinition<
  TType extends IntrinsicTypeName = IntrinsicTypeName,
  TAlias extends IntrinsicTypeName | undefined = undefined
> = (InlineFieldDefinition[TType] | TypeAliasDefinition<string, TAlias>) & FieldDefinitionBase
