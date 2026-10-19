// Schema types matching the Northfold seed (repos/northfold-storefront/scripts/content.ts and
// scripts/seed-history.ts). Field names follow the seeded documents exactly.
import {defineArrayMember, defineField, defineType} from 'sanity'

const locale = defineField({
  name: 'locale',
  type: 'string',
  options: {list: ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'fr-CA']},
})

export const landing = defineType({
  name: 'landing',
  title: 'Landing page',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}}),
    locale,
    defineField({name: 'eyebrow', type: 'string'}),
    defineField({name: 'heroStyle', type: 'string', options: {list: ['standard', 'countdown']}}),
    defineField({name: 'heroHeadline', type: 'string'}),
    defineField({name: 'heroSub', type: 'string'}),
    defineField({name: 'heroEndsAt', type: 'datetime'}),
    defineField({name: 'offerKind', type: 'string'}),
    defineField({name: 'offerTitle', type: 'string'}),
    defineField({name: 'offerBody', type: 'text', rows: 2}),
    defineField({name: 'cta', title: 'CTA', type: 'string'}),
  ],
  preview: {select: {title: 'title', subtitle: 'heroHeadline'}},
})

export const category = defineType({
  name: 'category',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}}),
    locale,
    defineField({name: 'intro', type: 'text', rows: 2}),
    defineField({name: 'banner', type: 'string'}),
    defineField({name: 'sortNote', type: 'string'}),
  ],
})

export const product = defineType({
  name: 'product',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}}),
    locale,
    defineField({name: 'currency', type: 'string'}),
    defineField({name: 'category', type: 'reference', to: [{type: 'category'}]}),
    defineField({name: 'campaigns', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'price', type: 'number'}),
    defineField({name: 'salePrice', type: 'number'}),
    defineField({name: 'saleBadge', type: 'string'}),
    defineField({name: 'promoLine', type: 'string'}),
    defineField({name: 'description', type: 'text', rows: 3}),
    defineField({name: 'features', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({
      name: 'specs',
      title: 'Specs',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'drop', title: 'Drop (mm)', type: 'number'}),
        defineField({name: 'lugDepth', title: 'Lug depth (mm)', type: 'number'}),
        defineField({name: 'weight', title: 'Weight', type: 'string'}),
        defineField({name: 'stackHeight', title: 'Stack height', type: 'string'}),
      ],
    }),
    defineField({name: 'colorway', type: 'string'}),
    defineField({name: 'sizeChart', type: 'text', rows: 2}),
    defineField({
      name: 'buyBoxStyle',
      type: 'string',
      options: {list: ['standard', 'price-first']},
    }),
    defineField({name: 'buyBoxCta', title: 'Buy box CTA', type: 'string'}),
    defineField({name: 'buyBoxNote', title: 'Buy box note', type: 'string'}),
  ],
  preview: {select: {title: 'title', subtitle: 'saleBadge'}},
})

export const cartMessage = defineType({
  name: 'cartMessage',
  title: 'Cart message',
  type: 'document',
  fields: [
    defineField({name: 'placement', type: 'string'}),
    locale,
    defineField({name: 'tone', type: 'string'}),
    defineField({name: 'text', type: 'string'}),
  ],
  preview: {select: {title: 'text', subtitle: 'placement'}},
})

export const checkoutMessage = defineType({
  name: 'checkoutMessage',
  title: 'Checkout message',
  type: 'document',
  fields: [
    defineField({name: 'key', type: 'string'}),
    locale,
    defineField({name: 'currency', type: 'string'}),
    defineField({name: 'threshold', type: 'number'}),
    defineField({name: 'kind', type: 'string'}),
    defineField({name: 'text', type: 'string'}),
  ],
  preview: {select: {title: 'text', subtitle: 'key'}},
})

export const schemaTypes = [landing, category, product, cartMessage, checkoutMessage]
