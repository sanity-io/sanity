import {defineField, defineType} from 'sanity'

export const page = defineType({
  type: 'document',
  name: 'page',
  title: 'Page',
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
    defineField({
      name: 'blocks',
      title: 'Blocks',
      type: 'array',
      of: [{type: 'hero'}, {type: 'logo-carousel'}, {type: 'testimonials'}],
      options: {
        insertMenu: {
          filter: true,
          views: [
            {name: 'grid', previewUrl: (name) => `/static/preview-${name}.png`},
            {name: 'list'},
          ],
          groups: [
            {
              name: 'intro',
              title: 'Intro',
              of: ['hero'],
            },
            {
              name: 'storytelling',
              title: 'Storytelling',
            },
            {
              name: 'upsell',
              title: 'Upsell',
              of: ['testimonials', 'hero'],
            },
          ],
        },
      },
    }),
  ],
})

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
            {name: 'grid', previewUrl: (name) => `/static/preview-${name}.png`},
            {name: 'list'},
          ],
        },
      },
    }),
  ],
})
