import {defineField, defineType} from 'sanity'
import {BasketIcon, ImageIcon} from '@sanity/icons'

export const emailsType = defineField({
  name: 'emails',
  title: 'Emails',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading 1', value: 'h1'},
            {title: 'Heading 2', value: 'h2'},
            {title: 'Heading 3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Underline', value: 'underline'},
            ],
          },
        },
        {
          name: 'products',
          type: 'object',
          title: 'Products',
          icon: BasketIcon,
          fields: [
            {name: 'products', type: 'array', of: [{type: 'reference', to: [{type: 'product'}]}]},
          ],
          preview: {
            select: {
              products: 'products',
            },
            prepare(selection: any) {
              const {products} = selection
              return {
                title: 'Products',
                subtitle: `${products.length} products`,
              }
            },
          },
        },
        {
          type: 'image',
          icon: ImageIcon,
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative text',
              description: 'Important for SEO and accessibility.',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'In Progress', value: 'inprogress'},
          {title: 'Ready for Review', value: 'ready-for-review'},
          {title: 'Ready', value: 'ready'},
          {title: 'Sent', value: 'sent'},
        ],
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'inprogress',
    }),
    defineField({
      name: 'marketingCampaign',
      title: 'Marketing Campaign',
      type: 'reference',
      to: [{type: 'marketingCampaign'}],
      weak: true,
    }),
    defineField({
      name: 'klaviyoListId',
      title: 'Klaviyo List ID',
      type: 'string',
      description: 'Optional: Override the default Klaviyo list ID for this post',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      status: 'status',
      media: 'body.0.asset',
    },
    prepare(selection: any) {
      const {title, status, media} = selection
      return {
        title: title || 'Untitled Email',
        subtitle: status ? `Status: ${status}` : 'No status',
        media: media,
      }
    },
  },
})
