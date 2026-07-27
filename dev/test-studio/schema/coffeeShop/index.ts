import {BasketIcon} from '@sanity/icons/Basket'
import {BillIcon} from '@sanity/icons/Bill'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {HomeIcon} from '@sanity/icons/Home'
import {TagIcon} from '@sanity/icons/Tag'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Schema types for the Brew & Bean coffee shop Presentation demo.
 * Products carry a discount field you can override per variant; referenced promo/origin
 * documents resolve to their variant content in the same query.
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
  icon: BasketIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'string',
      description: 'Short summary shown on product cards.',
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

const heroSection = defineArrayMember({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  icon: HomeIcon,
  fields: [
    defineField({name: 'headline', title: 'Headline', type: 'string'}),
    defineField({name: 'subheadline', title: 'Subheadline', type: 'text', rows: 2}),
    defineField({name: 'image', title: 'Image', type: 'image'}),
    defineField({name: 'ctaLabel', title: 'CTA label', type: 'string'}),
  ],
  preview: {
    select: {title: 'headline', subtitle: 'subheadline', media: 'image'},
    prepare({title, subtitle, media}) {
      return {title: title || 'Hero', subtitle, media}
    },
  },
})

const featuredProductsSection = defineArrayMember({
  name: 'featuredProducts',
  title: 'Featured products',
  type: 'object',
  icon: BasketIcon,
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'demoCoffeeProduct'}]})],
      description: 'Leave empty to show the latest products automatically.',
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Featured products'}
    },
  },
})

const promoBannerSection = defineArrayMember({
  name: 'promoBanner',
  title: 'Promo banner',
  type: 'object',
  icon: BillIcon,
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'tagline', title: 'Tagline', type: 'string'}),
    defineField({name: 'ctaLabel', title: 'CTA label', type: 'string'}),
    defineField({
      name: 'promo',
      title: 'Promo document',
      type: 'reference',
      to: [{type: 'demoCoffeePromo'}],
      description: 'Optional — when set, title/tagline/cta fall back to the referenced promo.',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'tagline'},
    prepare({title, subtitle}) {
      return {title: title || 'Promo banner', subtitle}
    },
  },
})

const storySection = defineArrayMember({
  name: 'story',
  title: 'Story',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({name: 'image', title: 'Image', type: 'image'}),
  ],
  preview: {
    select: {title: 'heading', media: 'image'},
    prepare({title, media}) {
      return {title: title || 'Story', media}
    },
  },
})

const originsSection = defineArrayMember({
  name: 'origins',
  title: 'Origins',
  type: 'object',
  icon: EarthGlobeIcon,
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({
      name: 'origins',
      title: 'Origins',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'demoCoffeeOrigin'}]})],
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Origins'}
    },
  },
})

const ctaSection = defineArrayMember({
  name: 'cta',
  title: 'Call to action',
  type: 'object',
  icon: BillIcon,
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({name: 'body', title: 'Body', type: 'text', rows: 3}),
    defineField({name: 'buttonLabel', title: 'Button label', type: 'string'}),
  ],
  preview: {
    select: {title: 'heading', subtitle: 'buttonLabel'},
    prepare({title, subtitle}) {
      return {title: title || 'CTA', subtitle}
    },
  },
})

export const demoCoffeeLandingPage = defineType({
  name: 'demoCoffeeLandingPage',
  title: 'Coffee Demo: Landing page',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        heroSection,
        featuredProductsSection,
        promoBannerSection,
        storySection,
        originsSection,
        ctaSection,
      ],
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})

export const coffeeShopSchemaTypes = [
  demoCoffeeOrigin,
  demoCoffeePromo,
  demoCoffeeProduct,
  demoCoffeeLandingPage,
]

/** @deprecated Use `coffeeShopSchemaTypes` — kept for the full test-studio schema import. */
export const variantsDemoTypes = coffeeShopSchemaTypes
