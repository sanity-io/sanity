import {defineField, defineType} from 'sanity'

export const pageOneBlockType = defineType({
  type: 'document',
  name: 'pageOneBlockType',
  title: 'Page (One Block Type)',
  groups: [{name: 'meta'}, {name: 'blocks'}],
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
      group: 'meta',
    }),
    defineField({
      name: 'blocks',
      title: 'Blocks',
      type: 'array',
      group: 'blocks',
      of: [{type: 'hero'}],
      options: {
        insertMenu: {
          views: [
            {name: 'grid', previewImageUrl: (name) => `/static/preview-${name}.png`},
            {name: 'list'},
          ],
        },
      },
    }),
  ],
})
