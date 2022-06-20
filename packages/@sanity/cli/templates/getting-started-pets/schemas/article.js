import {EyeOpenIcon, DocumentIcon} from '@sanity/icons'
import {ArticlePreview} from '../components/views/ArticlePreview'
import {JsonView} from '../components/views/JsonView'
import {getPriceRangeFromProducts} from '../utils/product'
import S from '@sanity/desk-tool/structure-builder'
import articleIcon from '../components/icons/articleIcon'

export default {
  name: 'article',
  type: 'document',
  title: 'Article',
  icon: articleIcon,
  views: [
    S.view.component(ArticlePreview).title('Preview').icon(EyeOpenIcon),
    S.view.component(JsonView).title('JSON').icon(DocumentIcon),
  ],
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'author',
      type: 'reference',
      title: 'Author',
      to: [{type: 'human'}],
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {type: 'block'},
        {type: 'image', options: {hotspot: true}},
        {
          type: 'object',
          title: 'Shoppable Products',
          name: 'products',
          preview: {
            select: {
              // Pick the first product image to show
              // This special syntax can be used to tell the studio to automatically resolve the reference before getting the image
              firstProductVariantMedia: 'products.0.variants.0.picture',
              // Pick all product names
              productName0: 'products.0.name',
              productName1: 'products.1.name',
              productName2: 'products.2.name',
              // Pick the variants field from all referenced products
              productVariants0: 'products.0.variants',
              productVariants1: 'products.1.variants',
              productVariants2: 'products.2.variants',
            },
            prepare({
              firstProductVariantMedia,
              productName0,
              productName1,
              productName2,
              productVariants0,
              productVariants1,
              productVariants2,
            }) {
              // Gather product names to show them as comma separated list
              const productNames = [productName0, productName1, productName2]
                .filter(Boolean)

                // Gather product variants so we can get price range from them
                .join(', ')
              const productVariants = [productVariants0, productVariants1, productVariants2]
                .filter(Boolean)
                .map((row) => ({
                  variants: Object.values(row),
                }))
              const priceRange = getPriceRangeFromProducts(productVariants)

              return {
                title: productNames,
                media: firstProductVariantMedia,
                subtitle: priceRange,
              }
            },
          },
          fields: [
            {
              name: 'introduction',
              title: 'Introduction',
              type: 'simpleBlockContent',
            },
            {
              name: 'products',
              title: 'Products',
              description: 'Pick between 1 and 3 products to highlight',
              type: 'array',
              validation: (Rule) => Rule.required().min(1).max(3),
              of: [
                {
                  type: 'reference',
                  to: [{type: 'product'}],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
