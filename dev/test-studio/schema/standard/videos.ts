import {VideoIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {defineVideoField} from 'sanity/media-library'

export default defineType({
  name: 'videosTest',
  type: 'document',
  title: 'Videos test',
  icon: VideoIcon,
  groups: [{name: 'content', title: 'Content'}],
  fieldsets: [{name: 'coolVideos', title: 'Cool Videos'}],
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
    defineVideoField({
      title: 'A simple video in content group',
      name: 'someVideoInContentGroup',
      group: 'content',
    }),
    defineVideoField({
      title: 'A simple video in a fieldset',
      name: 'someVideoInFieldset',
      fieldset: 'coolVideos',
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
