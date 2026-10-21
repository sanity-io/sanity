import {defineType} from '@sanity/types'

import {createLazyComponent} from '../../../core/components/lazy/createLazyComponent'
import {VideoField} from '../VideoInput/VideoField'

// The plugin module is bundled into every studio whether or not `mediaLibrary.enabled` is set,
// so the video input (player, upload handling) loads when a video field first renders instead.
// The wrapper carries its own Suspense boundary, so the schema component works wherever an
// input is rendered, not only under the form middleware's boundary.
const StudioVideoInput = createLazyComponent(
  () => import('../VideoInput/StudioVideoInput.lazy'),
  // Renders nothing while the chunk loads, which is what this did before the boundary became
  // opt-in. Without one the first video field render suspends to `FormNodeSuspense`, which swaps
  // the field for the generic skeleton and logs the custom-input warning.
  {fallback: null},
)

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
