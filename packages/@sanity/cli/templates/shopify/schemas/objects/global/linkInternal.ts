import {LinkIcon} from '@sanity/icons'
import {defineField} from 'sanity'

import {PAGE_REFERENCES} from '../../../constants'
import {getPriceRange} from '../../../utils/getPriceRange'

export default defineField({
  title: 'Internal Link',
  name: 'linkInternal',
  type: 'object',
  icon: LinkIcon,
  fields: [
    // Title
    {
      title: 'Title',
      name: 'title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    // Reference
    {
      name: 'reference',
      type: 'reference',
      weak: true,
      validation: (Rule) => Rule.required(),
      to: PAGE_REFERENCES,
    },
  ],
  preview: {
    select: {
      reference: 'reference',
      referenceProductTitle: 'reference.store.title',
      referenceProductPriceRange: 'reference.store.priceRange',
      referenceTitle: 'reference.title',
      referenceType: 'reference._type',
      title: 'title',
    },
    prepare(selection) {
      const {
        reference,
        referenceProductPriceRange,
        referenceProductTitle,
        referenceTitle,
        referenceType,
        title,
      } = selection

      let subtitle = []
      if (reference) {
        subtitle.push([`→ ${referenceTitle || referenceProductTitle || reference?._id}`])
        if (referenceType === 'product' && referenceProductPriceRange) {
          subtitle.push(`(${getPriceRange(referenceProductPriceRange)})`)
        }
      } else {
        subtitle.push('(Nonexistent document reference)')
      }

      return {
        // media: image,
        subtitle: subtitle.join(' '),
        title,
      }
    },
  },
})
