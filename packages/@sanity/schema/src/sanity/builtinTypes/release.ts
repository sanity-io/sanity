import {RELEASE_METADATA_TYPE_NAME} from './releaseMetadata'

export const RELEASE_DOCUMENT_TYPE_NAME = 'system.release'

/**
 * Releases are stored at `_.releases.<name>` and are written through
 * `sanity.action.release.*`, never through document patches.
 */
export default {
  name: RELEASE_DOCUMENT_TYPE_NAME,
  title: 'Release',
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
    },
    {
      name: 'publishAt',
      title: 'Publish at',
      type: 'datetime',
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    },
    {
      name: 'metadata',
      title: 'Metadata',
      type: RELEASE_METADATA_TYPE_NAME,
    },
  ],
  preview: {
    select: {
      title: 'metadata.title',
      subtitle: 'state',
    },
  },
}
