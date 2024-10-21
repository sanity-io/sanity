import {defineType} from '@sanity/types'

export default defineType({
  name: 'playlist',
  title: 'Playlist',
  type: 'document',
  // eslint-disable-next-line camelcase
  __experimental_formPreviewTitle: false,
  liveEdit: true,
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'tracks',
      title: 'Tracks',
      type: 'array',
      of: [{type: 'playlistTrack'}],
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
    },
    {
      name: 'readOnlyObject',
      title: 'Read only object',
      type: 'object',
      readOnly: true,
      fields: [
        {
          name: 'selfDefinedReadOnlyField',
          title: 'Read only field',
          description: 'ReadOnly defined in field',
          type: 'string',
          readOnly: true,
        },
        {
          name: 'inheritedReadOnlyField',
          title: 'Read only field',
          description: 'ReadOnly inherited from object',
          type: 'string',
        },
      ],
    },
    {
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'blocks',
          fields: [
            {
              type: 'array',
              name: 'blocks',
              title: 'Grid',
              of: [{type: 'playlistTrack'}],
            },
          ],
          readOnly: () => {
            return true
          },
        },
        {
          type: 'object',
          name: 'textBlocks',
          fields: [
            {
              type: 'text',
              name: 'text',
              title: 'Text',
            },
          ],
        },
      ],
    },
    {
      name: 'sectionsReadOnly',
      title: 'Sections (read only)',
      type: 'array',
      readOnly: true,
      of: [
        {
          type: 'object',
          name: 'blocks',
          fields: [
            {
              type: 'array',
              name: 'blocks',
              title: 'Grid',
              of: [{type: 'playlistTrack'}],
            },
          ],
        },
        {
          type: 'object',
          name: 'textBlocks',
          fields: [
            {
              type: 'text',
              name: 'text',
              title: 'Text',
            },
          ],
        },
      ],
    },
  ],
})
