import {defineField, defineType} from '@sanity/types'

import {RELEASE_DOCUMENT_TYPE} from '../store/constants'
import {RELEASE_METADATA_TYPE_NAME} from './releaseMetadata'

/**
 * Releases are stored at `_.releases.<name>` and are written through `sanity.action.release.*`,
 * never through document patches, so the type is read-only and kept out of templates, search and
 * the default Structure lists.
 *
 * @internal
 */
export const releaseSchema = defineType({
  name: RELEASE_DOCUMENT_TYPE,
  title: 'Release',
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
      name: 'state',
      title: 'State',
      type: 'string',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Archiving', value: 'archiving'},
          {title: 'Unarchiving', value: 'unarchiving'},
          {title: 'Archived', value: 'archived'},
          {title: 'Published', value: 'published'},
          {title: 'Publishing', value: 'publishing'},
          {title: 'Scheduled', value: 'scheduled'},
          {title: 'Scheduling', value: 'scheduling'},
        ],
      },
    }),
    defineField({
      name: 'error',
      title: 'Error',
      type: 'object',
      description: 'Set when an action on the release failed, such as publishing or scheduling.',
      hidden: true,
      fields: [defineField({name: 'message', title: 'Message', type: 'string'})],
    }),
    defineField({
      name: 'publishAt',
      title: 'Publish at',
      type: 'datetime',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    }),
    defineField({
      name: 'metadata',
      title: 'Metadata',
      type: RELEASE_METADATA_TYPE_NAME,
    }),
    defineField({
      name: 'finalDocumentStates',
      title: 'Final document states',
      type: 'array',
      description: 'Documents that were in the release when it was published or archived.',
      hidden: true,
      of: [
        {
          type: 'object',
          fields: [defineField({name: 'id', title: 'Document ID', type: 'string'})],
        },
      ],
    }),
    defineField({
      name: 'userId',
      title: 'User ID',
      type: 'string',
      description:
        'The user who took an action on the release that runs in the background, such as scheduling, unscheduling or publishing.',
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: 'metadata.title',
      subtitle: 'state',
    },
  },
})
