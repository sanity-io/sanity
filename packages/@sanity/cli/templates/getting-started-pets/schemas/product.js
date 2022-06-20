import {CreditCardIcon, EyeOpenIcon, DocumentIcon} from '@sanity/icons'
import {ProductPreview} from '../components/views/ProductPreview'
import S from '@sanity/desk-tool/structure-builder'
import {JsonView} from '../components/views/JsonView'
import productIcon from '../components/icons/productIcon'

export default {
  name: 'product',
  type: 'document',
  title: 'Product',
  icon: productIcon,
  views: [
    S.view.component(ProductPreview).title('Preview').icon(EyeOpenIcon),
    S.view.component(JsonView).title('JSON').icon(DocumentIcon),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'variants.0.picture',
      variants: 'variants',
    },
    prepare({title, media, variants = []}) {
      const priceRangeMin = Math.min(...Object.values(variants).map((variant) => variant.price))
      const priceRangeMax = Math.max(...Object.values(variants).map((variant) => variant.price))
      const singlePrice = variants?.[0]?.price
      const priceRange =
        priceRangeMax > priceRangeMin
          ? `$${priceRangeMin} - $${priceRangeMax}`
          : singlePrice
          ? `$${priceRangeMax}`
          : 'No price set'

      return {
        title,
        media,
        subtitle: priceRange,
      }
    },
  },
  fields: [
    {
      name: 'name',
      type: 'string',
      title: 'Name',
    },
    {
      name: 'tagline',
      type: 'string',
      title: 'Tagline',
    },
    {
      name: 'material',
      type: 'string',
      title: 'Material',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
    },
    {
      name: 'variants',
      description:
        'This is an array of objects. Unlike references, objects are always a part of a parent document.',
      title: 'Variants',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              type: 'string',
              title: 'Name',
            },
            {
              name: 'price',
              type: 'number',
              title: 'Price (USD)',
            },
            {
              name: 'size',
              type: 'array',
              of: [{type: 'string'}],
              title: 'Size',
            },
            {
              name: 'picture',
              type: 'image',
              title: 'Picture',
              options: {
                hotspot: true, // <-- Defaults to false
              },
              fields: [
                {
                  name: 'caption',
                  type: 'string',
                  title: 'Caption',
                  options: {
                    isHighlighted: true, // <-- make this field easily accessible
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
