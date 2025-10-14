import {defineLocalDecideField, defineType} from 'sanity'

export default defineType({
  type: 'document',
  name: 'markdownTest',
  title: 'Markdown test',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
    defineLocalDecideField({
      type: 'markdown',
      name: 'markdown',
      title: 'Markdown',
    }),
  ],
})
