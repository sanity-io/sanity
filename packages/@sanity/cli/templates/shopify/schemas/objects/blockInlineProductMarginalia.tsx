import {hues} from '@sanity/color'
import {TagIcon} from '@sanity/icons'
import React from 'react'

export default {
  title: 'Product (marginalia)',
  name: 'blockInlineProductMarginalia',
  type: 'object',
  icon: TagIcon,
  initialValue: {
    action: 'addToCart',
    quantity: 1,
  },
  fieldsets: [
    {
      name: 'callToAction',
      title: 'Call to action',
      options: {
        columns: 2,
      },
    },
  ],
  fields: [
    // Product
    {
      name: 'productWithVariant',
      title: 'Product + Variant',
      type: 'productWithVariant',
      validation: (Rule) => Rule.required(),
    },
    // Quantity
    {
      fieldset: 'callToAction',
      name: 'quantity',
      title: 'Quantity',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(10),
    },
    // Action
    {
      fieldset: 'callToAction',
      name: 'action',
      title: 'Action',
      type: 'string',
      options: {
        list: [
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
    },
  ],
  preview: {
    select: {
      productTitle: 'productWithVariant.product.store.title',
    },
    component(props) {
      // Selected object values are accessible via `props.value`
      return (
        <span style={{color: hues.orange[500].hex}}>
          <TagIcon style={{verticalAlign: 'text-bottom'}} />
          {props?.value?.productTitle || 'Select product'}
        </span>
      )
    },
  },
}
