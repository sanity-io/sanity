import {defineType} from '@sanity/types'

import {StudioVideoInput} from '../VideoInput/StudioVideoInput'

export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'object',
  components: {
    input: StudioVideoInput,
  },
  fields: [
    {
      name: 'asset',
      type: 'reference',
      to: {type: 'sanity.videoAsset'},
    },
    {
      name: 'media',
      type: 'globalDocumentReference',
      hidden: true,
      to: [
        {
          type: 'sanity.asset',
          preview: {},
        },
      ],
      resourceType: 'media-library',
      resourceId: '_',
    },
  ],
})
