import {BillIcon} from '@sanity/icons/Bill'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {TagIcon} from '@sanity/icons/Tag'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Schema types for the "Coffee Shop Demo" tool (see `plugins/variants-coffee-demo`), used to demo
 * document variants powering personalization: products carry a discount field you can override per
 * variant, and referenced promo/origin documents resolve to their variant content in the same query.
 */

export const demoCoffeeOrigin = defineType({
  name: 'demoCoffeeOrigin',
  title: 'Coffee Demo: Origin',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'region', title: 'Region', type: 'string'}),
    defineField({name: 'image', title: 'Image', type: 'image'}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'region', media: 'image'},
  },
})

export const demoCoffeePromo = defineType({
  name: 'demoCoffeePromo',
  title: 'Coffee Demo: Promo',
  type: 'document',
  icon: BillIcon,
  description:
    'A store-wide promo referenced by products. Give this document variant content (e.g. a VIP message for returning visitors) to demo reference resolution across variants.',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'tagline', title: 'Tagline', type: 'string'}),
    defineField({name: 'ctaLabel', title: 'Call to action label', type: 'string'}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'tagline'},
  },
})

export const demoCoffeeProduct = defineType({
  name: 'demoCoffeeProduct',
  title: 'Coffee Demo: Product',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'string',
      description: 'Short summary shown on the product listing page.',
    }),
    defineField({name: 'image', title: 'Product image', type: 'image'}),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'discount',
      title: 'Discount (%)',
      type: 'number',
      description:
        'Percentage off the listed price. Override this field in a variant (e.g. returning visitors) to demo personalization.',
      validation: (rule) => rule.min(0).max(100),
    }),
    defineField({
      name: 'origin',
      title: 'Origin',
      type: 'reference',
      to: [{type: 'demoCoffeeOrigin'}],
    }),
    defineField({
      name: 'promo',
      title: 'Promo',
      type: 'reference',
      to: [{type: 'demoCoffeePromo'}],
      description:
        'The promo shown with this product. The referenced document resolves to its variant content when the query carries a variant.',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'excerpt', discount: 'discount', media: 'image'},
    prepare({title, subtitle, discount, media}) {
      const discountLabel =
        typeof discount === 'number' && discount > 0 ? `${discount}% off` : undefined
      return {title, subtitle: discountLabel || subtitle, media}
    },
  },
})

export const variantsDemoTypes = [demoCoffeeOrigin, demoCoffeePromo, demoCoffeeProduct]
