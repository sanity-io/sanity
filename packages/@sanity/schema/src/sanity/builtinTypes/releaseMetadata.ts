import {type ConditionalPropertyCallbackContext, type Rule} from '@sanity/types'

export const RELEASE_METADATA_TYPE_NAME = 'sanity.releaseMetadata'

/**
 * Fields every `sanity.releaseMetadata` type has. Release create and edit
 * actions, and the releases tool, read these keys.
 */
export const releaseMetadataCoreFields = [
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
]

export const releaseMetadataCoreFieldNames: readonly string[] = releaseMetadataCoreFields.map(
  (field) => field.name,
)

export default {
  name: RELEASE_METADATA_TYPE_NAME,
  title: 'Release metadata',
  type: 'object',
  fields: releaseMetadataCoreFields,
}
