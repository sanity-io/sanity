import {defineArrayMember, defineField, defineType} from '@sanity/types'

import {VARIANT_DOCUMENT_TYPE} from '../store/constants'
import {VARIANT_METADATA_TYPE_NAME} from './variantMetadata'

/**
 * Variant definitions are stored at `_.variants.<name>` and are written through
 * `sanity.action.variant.definition.*`, never through document patches, so the type is read-only
 * and kept out of templates, search and the default Structure lists.
 *
 * @internal
 */
export const variantSchema = defineType({
  name: VARIANT_DOCUMENT_TYPE,
  title: 'Variant',
  type: 'document',
  liveEdit: true,
  readOnly: true,
  __experimental_omnisearch_visibility: false,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'conditions',
      title: 'Conditions',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'condition',
          title: 'Condition',
          type: 'object',
          fields: [
            defineField({name: 'condition', title: 'Condition', type: 'string'}),
            defineField({name: 'value', title: 'Value', type: 'string'}),
          ],
          preview: {
            select: {title: 'condition', subtitle: 'value'},
          },
        }),
      ],
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number',
      description:
        'When multiple variant definitions match with the same specificity, the one with the higher priority wins.',
    }),
    defineField({
      name: 'metadata',
      title: 'Metadata',
      type: VARIANT_METADATA_TYPE_NAME,
    }),
  ],
  preview: {
    select: {
      title: 'metadata.title',
      subtitle: 'name',
    },
  },
})
