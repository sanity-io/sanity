import {VideoIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {defineVideoField} from 'sanity/media-library'

export default defineType({
  name: 'videosTest',
  type: 'document',
  title: 'Videos test',
  icon: VideoIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    defineVideoField({
      title: 'A simple video',
      name: 'someVideo',
    }),
    defineField({
      name: 'arrayOfVideos',
      type: 'array',
      of: [
        defineVideoField({
          name: 'video',
        }),
      ],
    }),
    defineField({
      name: 'objectWithVideos',
      type: 'object',
      fields: [
        defineVideoField({
          name: 'video',
        }),
        defineVideoField({
          name: 'video2',
        }),
      ],
    }),
    defineField({
      name: 'portableTextWithVideos',
      type: 'array',
      of: [
        {
          type: 'block',
          of: [
            defineVideoField({
              name: 'video',
            }),
          ],
        },
        defineVideoField({
          name: 'video',
        }),
      ],
    }),
  ],
})
