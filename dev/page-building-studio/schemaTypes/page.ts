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
      of: [
        {type: 'hero'},
        {type: 'logo-carousel'},
        {type: 'testimonials'},
        {type: 'threeVideos'},
        {type: 'byTheNumbers'},
        {type: 'productCombos'},
      ],
      options: {
        insertMenu: {
          views: [
            {name: 'grid', previewImageUrl: (name) => `/static/preview-${name}.png`},
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
