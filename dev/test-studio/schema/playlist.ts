import {defineType} from '@sanity/types'

export default defineType({
  name: 'playlist',
  title: 'Playlist',
  type: 'document',
  // eslint-disable-next-line camelcase
  __experimental_formPreviewTitle: false,
  // TODO: How to handle live edit? Push to history with every keypress?
  // liveEdit: true,
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {
        source: 'name',
      },
    },
  ],
})
