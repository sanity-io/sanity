/* eslint-disable import/no-extraneous-dependencies */
import {FaArrowsRotate} from 'react-icons/fa6'
import {defineField, defineType} from 'sanity'

export const logoCarousel = defineType({
  type: 'object',
  name: 'logo-carousel',
  title: 'Logos',
  description: 'Logo carousel',
  fields: [
    defineField({
      type: 'array',
      name: 'logos',
      title: 'Logos',
      of: [{type: 'image'}],
    }),
  ],
  preview: {
    select: {},
    prepare() {
      return {
        title: 'Logos',
        subtitle: 'Logo carousel',
        media: FaArrowsRotate,
      }
    },
  },
})
