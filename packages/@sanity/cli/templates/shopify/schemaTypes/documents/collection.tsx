
import {defineArrayMember, defineField, defineType} from 'sanity'
import {PackageIcon} from '@sanity/icons'
import {getExtension} from '@sanity/asset-utils'
import pluralize from 'pluralize-esm'
import CollectionHiddenInput from '../../components/inputs/CollectionHidden'
import ShopifyDocumentStatus from '../../components/media/ShopifyDocumentStatus'
import { GROUPS } from '../../constants'

export const collectionType = defineType({
  name: 'collection',
  title: 'Collection',
  type: 'document',
  icon: PackageIcon,
  groups: GROUPS,
  fields: [
    defineField({
      name: 'hidden',
      type: 'string',
      components: {
        field: CollectionHiddenInput,
      },
      hidden: ({parent}) => {
        const isDeleted = parent?.store?.isDeleted
        return !isDeleted
      },
    }),
    defineField({
      name: 'titleProxy',
      title: 'Title',
      type: 'proxyString',
      options: {field: 'store.title'},
    }),
    defineField({
      name: 'slugProxy',
      title: 'Slug',
      type: 'proxyString',
      options: {field: 'store.slug.current'},
    }),
    defineField({
      name: 'colorTheme',
      type: 'reference',
      to: [{type: 'colorTheme'}],
      group: 'theme',
    }),
    defineField({
      name: 'vector',
      title: 'Vector artwork',
      type: 'image',
      description: 'Displayed in collection links using color theme',
      options: {
        accept: 'image/svg+xml',
      },
      group: 'theme',
      validation: (Rule) =>
        Rule.custom((image) => {
          if (!image?.asset?._ref) {
            return true
          }

          const format = getExtension(image.asset._ref)

          if (format !== 'svg') {
            return 'Image must be an SVG'
          }
          return true
        }),
    }),
    defineField({
      name: 'showHero',
      type: 'boolean',
      description: 'If disabled, page title will be displayed instead',
      group: 'editorial',
    }),
    defineField({
      name: 'hero',
      type: 'hero',
      hidden: ({document}) => !document?.showHero,
      group: 'editorial',
    }),
    defineField({
      name: 'modules',
      type: 'array',
      description: 'Editorial modules to associate with this collection',
      of: [
        defineArrayMember({type: 'callout'}),
        defineArrayMember({type: 'callToAction'}),
        defineArrayMember({type: 'image'}),
        defineArrayMember({type: 'instagram'}),
      ],
      group: 'editorial',
    }),
    defineField({
      name: 'store',
      title: 'Shopify',
      type: 'shopifyCollection',
      description: 'Collection data from Shopify (read-only)',
      group: 'shopifySync',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  orderings: [
    {
      name: 'titleAsc',
      title: 'Title (A-Z)',
      by: [{field: 'store.title', direction: 'asc'}],
    },
    {
      name: 'titleDesc',
      title: 'Title (Z-A)',
      by: [{field: 'store.title', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      imageUrl: 'store.imageUrl',
      isDeleted: 'store.isDeleted',
      rules: 'store.rules',
      title: 'store.title',
    },
    prepare({imageUrl, isDeleted, rules, title}) {
      const ruleCount = rules?.length || 0

      return {
        media: (
          <ShopifyDocumentStatus
            isDeleted={isDeleted}
            type="collection"
            url={imageUrl}
            title={title}
          />
        ),
        subtitle: ruleCount > 0 ? `Automated (${pluralize('rule', ruleCount, true)})` : 'Manual',
        title,
      }
    },
  },
})
