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
      type: 'globalDocumentReference',
      to: [
        {
          type: 'sanity.videoAsset',
          // Note: the preview configuration is not used in Studio, but it must be present in order
          // to satisfy global document reference schema validation.
          //
          // If an empty object is supplied, the preview configuration will be omitted when the
          // schema is extracted. Studio will be completely functional, but an error will occur
          // when another service (e.g. Agent Actions) attempts to parse the serialized schema and
          // finds the required preview configuration is absent.
          preview: {
            select: {
              title: '_id',
            },
          },
        },
      ],
      resourceType: 'media-library',
      resourceId: '_',
    },
    {
      name: 'media',
      type: 'globalDocumentReference',
      hidden: true,
      to: [
        {
          type: 'sanity.asset',
          // Note: the preview configuration is not used in Studio, but it must be present in order
          // to satisfy global document reference schema validation.
          //
          // If an empty object is supplied, the preview configuration will be omitted when the
          // schema is extracted. Studio will be completely functional, but an error will occur
          // when another service (e.g. Agent Actions) attempts to parse the serialized schema and
          // finds the required preview configuration is absent.
          preview: {
            select: {
              title: '_id',
            },
          },
        },
      ],
      resourceType: 'media-library',
      resourceId: '_',
    },
  ],
})
