import {FiBookOpen} from 'react-icons/fi'
import {MdVideoFile} from 'react-icons/md'
import {TbNumber123} from 'react-icons/tb'
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

export const byTheNumbers = defineType({
  type: 'object',
  icon: TbNumber123,
  name: 'byTheNumbers',
  title: 'By the Numbers',
  fields: [defineField({type: 'string', name: 'foo'})],
})

export const threeVideos = defineType({
  type: 'object',
  icon: MdVideoFile,
  name: 'threeVideos',
  title: 'Three Videos',
  fields: [defineField({type: 'string', name: 'foo'})],
})

export const productCombos = defineType({
  type: 'object',
  icon: FiBookOpen,
  name: 'productCombos',
  title: 'Product Combos',
  fields: [defineField({type: 'string', name: 'foo'})],
})
