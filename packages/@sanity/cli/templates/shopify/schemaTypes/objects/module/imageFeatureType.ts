import {ImageIcon} from '@sanity/icons'
import {defineField} from 'sanity'

const VARIANTS = [
  {title: 'Simple', value: undefined},
  {title: 'Caption', value: 'caption'},
  {title: 'Call to action', value: 'callToAction'},
  {title: 'Product hotspots', value: 'productHotspots'},
  {title: 'Product tags', value: 'productTags'},
]

export const imageFeatureType = defineField({
  name: 'imageFeature',
  title: 'Image Feature',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'variant',
      type: 'string',
      options: {
        direction: 'horizontal',
        layout: 'radio',
        list: VARIANTS,
      },
      initialValue: undefined,
    }),
    defineField({
      name: 'caption',
      type: 'text',
      rows: 2,
      hidden: ({parent}) => parent.variant !== 'caption',
    }),
    defineField({
      name: 'callToAction',
      type: 'imageCallToAction',
      hidden: ({parent}) => parent.variant !== 'callToAction',
    }),
    defineField({
      name: 'productHotspots',
      title: 'Hotspots',
      type: 'productHotspots',
      hidden: ({parent}) => parent.variant !== 'productHotspots',
    }),
    defineField({
      name: 'productTags',
      title: 'Products',
      type: 'array',
      hidden: ({parent}) => parent.variant !== 'productTags',
      of: [
        defineField({
          name: 'productWithVariant',
          type: 'productWithVariant',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      fileName: 'image.asset.originalFilename',
      image: 'image',
      variant: 'variant',
    },
    prepare({fileName, image, variant}) {
      const currentVariant = VARIANTS.find((v) => v.value === variant)

      return {
        media: image,
        subtitle: 'Image' + (currentVariant ? ` [${currentVariant.title}]` : ''),
        title: fileName,
      }
    },
  },
})
