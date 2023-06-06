import {BlockElementIcon, ImageIcon} from '@sanity/icons'
import {defineField} from 'sanity'

export default defineField({
  name: 'module.callToAction',
  title: 'Call to action',
  type: 'object',
  icon: BlockElementIcon,
  fieldsets: [
    {
      name: 'copy',
      title: 'Copy',
    },
  ],
  fields: [
    // Layout
    defineField({
      name: 'layout',
      title: 'Layout direction',
      type: 'string',
      initialValue: 'left',
      options: {
        direction: 'horizontal',
        layout: 'radio',
        list: [
          {
            title: 'Content / Copy',
            value: 'left',
          },
          {
            title: 'Copy / Content',
            value: 'right',
          },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    // Title
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      fieldset: 'copy',
    }),
    // Body
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 2,
      fieldset: 'copy',
    }),
    // Link
    defineField({
      name: 'links',
      title: 'Link',
      type: 'array',
      of: [{type: 'linkInternal'}, {type: 'linkExternal'}],
      validation: (Rule) => Rule.max(1),
      fieldset: 'copy',
    }),
    // Content
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      validation: (Rule) => Rule.required().max(1),
      of: [
        {
          icon: ImageIcon,
          type: 'image',
          title: 'Image',
          options: {hotspot: true},
        },
        {
          name: 'productWithVariant',
          title: 'Product + Variant',
          type: 'productWithVariant',
          validation: (Rule) => Rule.required(),
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare(selection) {
      const {title} = selection
      return {
        subtitle: 'Call to action',
        title,
        media: BlockElementIcon,
      }
    },
  },
})
