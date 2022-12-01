import React from 'react'
import {defineField} from 'sanity'
import ProductTooltip from '../../components/hotspots/ProductTooltip'
import ShopifyDocumentStatus from '../../components/media/ShopifyDocumentStatus'

export default defineField({
  name: 'productHotspots',
  title: 'Hotspots',
  type: 'array',
  of: [
    {
      name: 'spot',
      type: 'object',
      fieldsets: [{name: 'position', options: {columns: 2}}],
      fields: [
        defineField({
          name: 'productWithVariant',
          title: 'Product + Variant',
          type: 'productWithVariant',
        }),
        defineField({
          name: 'x',
          type: 'number',
          readOnly: true,
          fieldset: 'position',
          initialValue: 50,
          validation: (Rule) => Rule.required().min(0).max(100),
        }),
        defineField({
          name: 'y',
          type: 'number',
          readOnly: true,
          fieldset: 'position',
          initialValue: 50,
          validation: (Rule) => Rule.required().min(0).max(100),
        }),
      ],
      preview: {
        select: {
          isDeleted: 'productWithVariant.product.store.isDeleted',
          previewImageUrl: 'productWithVariant.product.store.previewImageUrl',
          productTitle: 'productWithVariant.product.store.title',
          status: 'productWithVariant.product.store.status',
          variantPreviewImageUrl: 'productWithVariant.variant.store.previewImageUrl',
          x: 'x',
          y: 'y',
        },
        prepare(selection) {
          const {isDeleted, previewImageUrl, productTitle, status, variantPreviewImageUrl, x, y} =
            selection
          return {
            media: (
              <ShopifyDocumentStatus
                isActive={status === 'active'}
                isDeleted={isDeleted}
                type="product"
                url={variantPreviewImageUrl || previewImageUrl}
                title={productTitle}
              />
            ),
            title: productTitle,
            subtitle: x && y ? `[${x}%, ${y}%]` : `No position set`,
          }
        },
      },
    },
  ],
  options: {
    imageHotspot: {
      imagePath: 'image',
      tooltip: ProductTooltip,
      pathRoot: 'parent',
    },
  },
})
