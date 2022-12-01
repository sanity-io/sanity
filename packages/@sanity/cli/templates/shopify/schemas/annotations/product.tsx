/**
 * Annotations are ways of marking up text in the block content editor.
 *
 * Read more: https://www.sanity.io/docs/customization#f924645007e1
 */
import {TagIcon} from '@sanity/icons'
import React from 'react'
import {defineField} from 'sanity'

export default defineField({
  title: 'Product',
  name: 'annotationProduct',
  type: 'object',
  // @ts-ignore - TODO - fix these TS errors
  blockEditor: {
    icon: () => <TagIcon />,
    // @ts-ignore
    render: ({children}) => (
      <>
        <TagIcon
          style={{
            marginLeft: '0.05em',
            marginRight: '0.1em',
            width: '0.75em',
          }}
        />
        {children}
      </>
    ),
  },
  fields: [
    // Product
    {
      name: 'productWithVariant',
      title: 'Product + Variant',
      type: 'productWithVariant',
      validation: (Rule) => Rule.required(),
    },
    // Link action
    defineField({
      name: 'linkAction',
      title: 'Link action',
      type: 'string',
      initialValue: 'link',
      options: {
        layout: 'radio',
        list: [
          {
            title: 'Navigate to product',
            value: 'link',
          },
          {
            title: 'Add to cart',
            value: 'addToCart',
          },
          {
            title: 'Buy now',
            value: 'buyNow',
          },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    // Quantity
    defineField({
      name: 'quantity',
      title: 'Quantity',
      type: 'number',
      initialValue: 1,
      hidden: ({parent}) => parent.linkAction === 'link',
      validation: (Rule) => Rule.required().min(1).max(10),
    }),
  ],
})
