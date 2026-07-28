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
    'A store-wide promo referenced by products. Give this document variant content (e.g. a VIP message for returning visitors) to demo reference resolution across variants. title/tagline/ctaLabel are localized (en/de/fr) via the regular internationalizedArray plugin — localization and Content Variants are independent systems that compose at query time.',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'internationalizedArrayString',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'tagline', title: 'Tagline', type: 'internationalizedArrayString'}),
    defineField({
      name: 'ctaLabel',
      title: 'Call to action label',
      type: 'internationalizedArrayString',
    }),
  ],
  preview: {
    select: {title: 'title.0.value', subtitle: 'tagline.0.value'},
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
      type: 'internationalizedArrayString',
      description: 'Localized (en/de/fr) via the regular internationalizedArray plugin.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: (doc) => {
          const title = doc.title as {_key: string; value?: string}[] | undefined
          return title?.find((entry) => entry._key === 'en')?.value ?? ''
        },
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'internationalizedArrayString',
      description:
        'Short summary shown on product cards. Localized (en/de/fr) via the regular internationalizedArray plugin.',
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
    defineField({
      name: 'sizeOptions',
      title: 'Size options',
      type: 'array',
      description:
        'Plain structured content, not a Content Variant — a customer picks a size, it does not depend on who they are.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'sizeOption',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'weightGrams',
              title: 'Weight (g)',
              type: 'number',
              validation: (rule) => rule.required().min(0),
            }),
            defineField({
              name: 'price',
              title: 'Price',
              type: 'number',
              validation: (rule) => rule.required().min(0),
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'price'},
            prepare({title, subtitle}) {
              return {
                title,
                subtitle: typeof subtitle === 'number' ? `$${subtitle.toFixed(2)}` : undefined,
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'grindOptions',
      title: 'Grind options',
      type: 'array',
      description: 'Also plain structured content, not a Content Variant.',
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: ['Whole bean', 'Ground — filter', 'Ground — espresso', 'Ground — French press'],
      },
    }),
  ],
  preview: {
    select: {
      title: 'title.0.value',
      subtitle: 'excerpt.0.value',
      discount: 'discount',
      media: 'image',
    },
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
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'internationalizedArrayString',
      description: 'Localized (en/de/fr) via the regular internationalizedArray plugin.',
    }),
    defineField({
      name: 'subheadline',
      title: 'Subheadline',
      type: 'internationalizedArrayString',
      description: 'Localized (en/de/fr) via the regular internationalizedArray plugin.',
    }),
    defineField({name: 'image', title: 'Image', type: 'image'}),
    defineField({
      name: 'ctaLabel',
      title: 'CTA label',
      type: 'internationalizedArrayString',
      description: 'Localized (en/de/fr) via the regular internationalizedArray plugin.',
    }),
  ],
  preview: {
    select: {title: 'headline.0.value', subtitle: 'subheadline.0.value', media: 'image'},
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
