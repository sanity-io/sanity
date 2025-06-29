import {VideoIcon} from '@sanity/icons'
import {defineType} from 'sanity'
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
  ],
})
