import {IceCreamIcon} from '@sanity/icons'
import React from 'react'
import {defineField, defineType} from 'sanity'

import ColorTheme from '../../components/media/ColorTheme'

export default defineType({
  name: 'colorTheme',
  title: 'Color theme',
  type: 'document',
  icon: IceCreamIcon,
  groups: [
    {
      name: 'shopifySync',
      title: 'Shopify sync',
    },
  ],
  fields: [
    // Title
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    // Text color
    defineField({
      name: 'text',
      title: 'Text',
      type: 'color',
      options: {disableAlpha: true},
      validation: (Rule) => Rule.required(),
    }),
    // Background color
    defineField({
      name: 'background',
      title: 'Background',
      type: 'color',
      options: {disableAlpha: true},
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      backgroundColor: 'background.hex',
      textColor: 'text.hex',
      title: 'title',
    },
    prepare(selection) {
      const {backgroundColor, textColor, title} = selection

      return {
        media: <ColorTheme background={backgroundColor} text={textColor} />,
        subtitle: `${textColor || '(No color)'} / ${backgroundColor || '(No color)'}`,
        title,
      }
    },
  },
})
