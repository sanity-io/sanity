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
  SpanDefinition,
  StringDefinition,
  TextDefinition,
  UrlDefinition,
} from './type'
import {BaseSchemaDefinition} from './type/common'

/**
 * This type can be extended being a interface and not a type, via declaration merging
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
  span: SpanDefinition
  string: StringDefinition
  text: TextDefinition
  url: UrlDefinition
}

/**
 * A union of all intrinsic types allowed natively in the schema.
 */
export type TypeName = IntrinsicDefinitions[keyof IntrinsicDefinitions]['type']

/**
 * Represents a Sanity schema type definition with an optional type parameter.
 *
 * It's recommend to use the `defineType` helper instead of this type by
 * itself.
 *
 * @see defineType
 */
export type SchemaTypeDefinition<TType extends TypeName = TypeName> =
  | IntrinsicDefinitions[TypeName]
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
export type TypeAliasDefinition<
  TType extends string,
  TAlias extends TypeName | undefined
> = BaseSchemaDefinition & {
  type: TType
  options?: TAlias extends TypeName ? IntrinsicDefinitions[TAlias]['options'] : unknown

  validation?: SchemaValidationValue
  initialValue?: InitialValueProperty<any, any>
  preview?: PreviewConfig
}

export interface FieldDefinitionBase {
  fieldset?: string
  group?: string | string[]
}

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
 */
export type FieldDefinition<
  TType extends TypeName = TypeName,
  TAlias extends TypeName | undefined = undefined
> = (InlineFieldDefinition[TType] | TypeAliasDefinition<string, TAlias>) & FieldDefinitionBase
