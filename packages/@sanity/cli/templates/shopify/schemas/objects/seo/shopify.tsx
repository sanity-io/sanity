import React from 'react'
import {defineField} from 'sanity'

export default defineField({
  name: 'seo.shopify',
  title: 'SEO',
  type: 'object',
  description: <></>,
  options: {
    collapsed: false,
    collapsible: true,
  },
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'placeholderString',
      description: (
        <>
          If empty, displays the default Shopify document title (<code>store.title</code>)
        </>
      ),
      options: {
        field: 'store.title',
      },
      validation: (Rule) =>
        Rule.max(50).warning('Longer titles may be truncated by search engines'),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'seo.description',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
    },
  ],
})
