import {
  defineArrayMember,
  defineField,
  type FieldDefinition,
  type ObjectDefinition,
  type SchemaValidationValue,
} from '@sanity/types'

import {withCoreMetadataFields} from '../../config/metadataConfig'
import {type VariantMetadataConfig} from '../../config/types'

/** @internal */
export const VARIANT_METADATA_TYPE_NAME = 'sanity.variantMetadata'

/**
 * The fields the variant create and edit dialogs, and the variants tool, read. They come first
 * in `sanity.variantMetadata`, and a configured field can't replace them.
 */
const VARIANT_METADATA_CORE_FIELDS: FieldDefinition[] = [
  defineField({
    name: 'title',
    title: 'Title',
    type: 'string',
    validation: (rule) => rule.required(),
  }),
  defineField({
    // The variants tool writes plain paragraphs and shows them as plain text.
    name: 'description',
    title: 'Description',
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
        styles: [{title: 'Normal', value: 'normal'}],
        lists: [],
        marks: {decorators: [], annotations: []},
      }),
    ],
  }),
  defineField({
    name: 'type',
    title: 'Type',
    type: 'string',
  }),
]

/**
 * The `sanity.variantMetadata` definition. Its `validation` takes anything a field's validation
 * does, like a list with the rules of several configs.
 *
 * @internal
 */
export interface VariantMetadataDefinition extends Omit<ObjectDefinition, 'name' | 'validation'> {
  name: typeof VARIANT_METADATA_TYPE_NAME
  validation?: SchemaValidationValue
}

/**
 * The `sanity.variantMetadata` object type: the core fields, followed by the fields, fieldsets,
 * groups and validation the workspace configures in `beta.variants.metadata`. A configured field
 * named like a core field is dropped with a warning.
 *
 * @internal
 */
export function variantMetadataSchema(
  config: VariantMetadataConfig = {},
): VariantMetadataDefinition {
  const {fields = [], ...rest} = config
  return {
    ...rest,
    name: VARIANT_METADATA_TYPE_NAME,
    title: 'Variant metadata',
    type: 'object',
    fields: withCoreMetadataFields('beta.variants.metadata', VARIANT_METADATA_CORE_FIELDS, fields),
  }
}
