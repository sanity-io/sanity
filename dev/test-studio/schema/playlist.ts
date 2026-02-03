import {defineType} from '@sanity/types'

import {CreateDraft} from './debug/components/CreateDraft'

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
      name: 'createDraft',
      title: 'Create Draft',
      type: 'string',
      description:
        "Clicking on the 'Create Draft' button will create a draft for this live edit document",
      components: {
        input: CreateDraft,
      },
    },
  ],
})
