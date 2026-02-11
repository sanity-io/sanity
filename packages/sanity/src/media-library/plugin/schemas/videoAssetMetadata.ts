import {defineType} from '@sanity/types'

export const videoAssetMetadataPlayback = defineType({
  name: 'sanity.videoMetadata.playback',
  title: 'Playback',
  type: 'object',
  fields: [{name: 'policy', type: 'string'}],
})

export const videoAssetMetadata = defineType({
  name: 'sanity.videoMetadata',
  title: 'Video metadata',
  type: 'object',
  fieldsets: [
    {
      name: 'extra',
      title: 'Extra metadata…',
      options: {
        collapsible: true,
      },
    },
  ],
  fields: [
    {
      name: 'duration',
      title: 'Duration (seconds)',
      type: 'number',
      readOnly: true,
    },
    {
      name: 'framerate',
      title: 'Frame Rate',
      type: 'number',
      readOnly: true,
    },
    {
      name: 'aspectRatio',
      title: 'Aspect Ratio',
      type: 'number',
      readOnly: true,
    },
    {
      name: 'hasAudio',
      title: 'Has audio',
      type: 'boolean',
      readOnly: true,
    },
    {
      name: 'codec',
      title: 'Codec',
      type: 'string',
      readOnly: true,
      fieldset: 'extra',
    },
    {
      name: 'bitrate',
      title: 'Bitrate',
      type: 'number',
      readOnly: true,
      fieldset: 'extra',
    },
  ],
})
