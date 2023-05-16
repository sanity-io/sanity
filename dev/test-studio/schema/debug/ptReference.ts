import {defineType} from 'sanity'

export default defineType({
  name: 'ptReference',
  title: 'Portable Text Reference',
  type: 'document',
  fields: [
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [{type: 'reference', to: {type: 'author'}}],
          },
          of: [{type: 'reference', to: {type: 'author'}}],
        },
        {type: 'reference', to: {type: 'author'}},
      ],
    },
  ],
})
