import React from 'react'
import {defineField} from 'sanity'

const ColorPreview = ({color}: {color: string}) => {
  return (
    <div
      style={{
        backgroundColor: color,
        borderRadius: 'inherit',
        display: 'flex',
        height: '100%',
        width: '100%',
      }}
    />
  )
}

export default defineField({
  name: 'customProductOption.colorObject',
  title: 'Color',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Shopify product option value (case sensitive)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'color',
      options: {disableAlpha: true},
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      color: 'color.hex',
      title: 'title',
    },
    prepare(selection) {
      const {color, title} = selection
      return {
        media: <ColorPreview color={color} />,
        subtitle: color,
        title,
      }
    },
  },
})
