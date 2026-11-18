import {VARIANT_METADATA_TYPE_NAME} from '../extendableTypes/variantMetadata'

export const VARIANT_DOCUMENT_TYPE_NAME = 'system.variant'

/**
 * Variant definitions are stored at `_.variants.<name>` and are written through
 * `sanity.action.variant.definition.*`, never through document patches.
 *
 * `conditions` is not declared: it maps condition keys chosen per definition to
 * values, and an object type can only describe a fixed set of fields.
 */
export default {
  name: VARIANT_DOCUMENT_TYPE_NAME,
  title: 'Variant',
  type: 'document',
  liveEdit: true,
  readOnly: true,
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'priority',
      title: 'Priority',
      type: 'number',
      description:
        'When multiple variant definitions match with the same specificity, the one with the higher priority wins.',
    },
    {
      name: 'metadata',
      title: 'Metadata',
      type: VARIANT_METADATA_TYPE_NAME,
    },
  ],
  preview: {
    select: {
      title: 'metadata.title',
      subtitle: 'name',
    },
  },
}
