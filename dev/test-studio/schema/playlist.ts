import {defineType} from '@sanity/types'

export default defineType({
  name: 'playlist',
  title: 'Playlist',
  type: 'document',
  // eslint-disable-next-line camelcase
  __experimental_hide_form_title: true,
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
  ],
})
