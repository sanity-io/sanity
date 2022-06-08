import {defineType} from 'sanity'
import {CustomContentInput} from './CustomContentInput'

export const ptCustomMarkersTestType = defineType({
  type: 'document',
  name: 'pt_customMarkersTest',
  title: 'Custom markers',

  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },

    {
      type: 'array',
      name: 'content',
      title: 'Content',
      of: [{type: 'block'}],
      components: {input: CustomContentInput},
    },
  ],
})
