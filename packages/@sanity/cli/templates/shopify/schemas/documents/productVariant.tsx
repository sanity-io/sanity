import {CopyIcon} from '@sanity/icons'
import React from 'react'
import ProductMediaPreview from '../../components/media/ProductStatus'
import ProductVariantHiddenInput from '../../components/inputs/ProductVariantHidden'

export default {
  // HACK: Required to hide 'create new' button in desk structure
  __experimental_actions: [/*'create',*/ 'update', /*'delete',*/ 'publish'],
  name: 'productVariant',
  title: 'Product variant',
  type: 'document',
  icon: CopyIcon,
  fields: [
    // Product variant hidden status
    {
      name: 'hidden',
      type: 'string',
      inputComponent: ProductVariantHiddenInput,
      hidden: ({parent}) => {
        const isDeleted = parent?.store?.isDeleted

        return !isDeleted
      },
    },
    // Title (proxy)
    {
      title: 'Title',
      name: 'titleProxy',
      type: 'proxyString',
      options: {field: 'store.title'},
    },
    // Shopify product variant
    {
      name: 'store',
      title: 'Shopify',
      description: 'Variant data from Shopify (read-only)',
      type: 'shopifyProductVariant',
    },
  ],
  preview: {
    select: {
      isDeleted: 'store.isDeleted',
      previewImageUrl: 'store.previewImageUrl',
      sku: 'store.sku',
      status: 'store.status',
      title: 'store.title',
    },
    prepare(selection) {
      const {isDeleted, previewImageUrl, sku, status, title} = selection

      return {
        media: (
          <ProductMediaPreview
            isActive={status === 'active'}
            isDeleted={isDeleted}
            type="productVariant"
            url={previewImageUrl}
          />
        ),
        subtitle: sku,
        title,
      }
    },
  },
}
