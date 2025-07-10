import {defineType} from '@sanity/types'

import {StudioVideoInput} from '../VideoInput/StudioVideoInput'
import {VideoField} from '../VideoInput/VideoField'

export const video = defineType({
  name: 'sanity.video',
  title: 'Video',
  type: 'object',
  components: {
    input: StudioVideoInput,
    field: VideoField,
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
