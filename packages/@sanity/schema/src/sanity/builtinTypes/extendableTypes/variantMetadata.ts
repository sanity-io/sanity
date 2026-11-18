import {type Rule} from '@sanity/types'

export const VARIANT_METADATA_TYPE_NAME = 'sanity.variantMetadata'

/**
 * The fields the variant create and edit dialogs, and the variants tool, read.
 * They are always part of `sanity.variantMetadata`, also when a schema extends it.
 */
export const VARIANT_METADATA_CORE_FIELDS = [
  {
    name: 'title',
    title: 'Title',
    type: 'string',
    validation: (rule: Rule): Rule => rule.required(),
  },
  {
    // The variants tool writes plain paragraphs and shows them as plain text.
    name: 'description',
    title: 'Description',
    type: 'array',
    of: [
      {
        type: 'block',
        styles: [{title: 'Normal', value: 'normal'}],
        lists: [],
        marks: {decorators: [], annotations: []},
      },
    ],
  },
  {
    // The keys come from `beta.variants.types`, which the schema can't read, and a
    // definition without one belongs to the `variant` type.
    name: 'type',
    title: 'Type',
    type: 'string',
    hidden: true,
  },
]

/** Metadata stored on variant definitions. */
export default {
  name: VARIANT_METADATA_TYPE_NAME,
  title: 'Variant metadata',
  type: 'object',
  fields: VARIANT_METADATA_CORE_FIELDS,
}
