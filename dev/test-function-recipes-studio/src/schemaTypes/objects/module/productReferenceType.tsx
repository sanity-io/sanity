import {TagIcon} from '@sanity/icons'

import {defineField} from 'sanity'

import ShopifyDocumentStatus from '../../../components/media/ShopifyDocumentStatus'

export const productReferenceType = defineField({
  name: 'productReference',
  title: 'Product',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'productWithVariant',
      type: 'productWithVariant',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      isDeleted: 'productWithVariant.product.store.isDeleted',
      previewImageUrl: 'productWithVariant.product.store.previewImageUrl',
      status: 'productWithVariant.product.store.status',
      title: 'productWithVariant.product.store.title',
    },
    prepare({isDeleted, previewImageUrl, status, title}) {
      return {
        media: (
          <ShopifyDocumentStatus
            isActive={status === 'active'}
            isDeleted={isDeleted}
            type="product"
            url={previewImageUrl}
            title={title}
          />
        ),
        subtitle: 'Product',
        title,
      }
    },
  },
})
