import {type ConditionalPropertyCallbackContext, type Rule} from '@sanity/types'

export const RELEASE_METADATA_TYPE_NAME = 'sanity.releaseMetadata'

/**
 * Metadata stored on content releases. Its fields are the core fields that
 * release create and edit actions, and the releases tool, read.
 */
export default {
  name: RELEASE_METADATA_TYPE_NAME,
  title: 'Release metadata',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'releaseType',
      title: 'Release type',
      type: 'string',
      initialValue: 'undecided',
      options: {
        list: [
          {title: 'ASAP', value: 'asap'},
          {title: 'At time', value: 'scheduled'},
          {title: 'Undecided', value: 'undecided'},
        ],
      },
      validation: (rule: Rule): Rule => rule.required(),
    },
    {
      name: 'intendedPublishAt',
      title: 'Intended publish date',
      type: 'datetime',
      hidden: ({parent}: ConditionalPropertyCallbackContext): boolean =>
        parent?.releaseType !== 'scheduled',
    },
    {
      name: 'cardinality',
      title: 'Cardinality',
      type: 'string',
      hidden: true,
      options: {
        list: [
          {title: 'Many documents', value: 'many'},
          {title: 'One document', value: 'one'},
        ],
      },
    },
  ],
}
