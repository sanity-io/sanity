import S from '@sanity/desk-tool/structure-builder'
import {EyeOpenIcon, RobotIcon} from '@sanity/icons'
import sanityClient from 'part:@sanity/base/client'

import {SANITY_API_VERSION} from '../constants'

// prettier-ignore
export const debug = S.listItem()
  .title('Debug')
  .icon(RobotIcon)
  .child(
    S.list()
      .title('Debug')
      .items(
        [
          // Products
          S.listItem()
            .title('Products')
            .schemaType('product')
            .child(
              S.documentTypeList('product')
                .defaultOrdering([{ field: 'store.title', direction: 'asc'}])
            ),
          // Product variants (loose)
          S.listItem()
            .title('Product Variants')
            .schemaType('productVariant')
            .child(
              S.documentTypeList('productVariant')
                .defaultOrdering([{ field: 'store.title', direction: 'asc'}])
            ),
          // Product variants
          S.listItem()
            .title('Product Variants (orphaned)')
            .icon(EyeOpenIcon)
            .child(async () => {
              const productIds = await sanityClient
                .withConfig({ apiVersion: SANITY_API_VERSION })
                .fetch(`
                  *[_type == "product"].store.id
                `)

              return S.documentList()
                .title('Variants')
                .schemaType('productVariant')
                .filter(`_type == "productVariant" && !(store.productId in $productIds)`)
                .params({
                  productIds
                })
            }
            ),
        ]
      )
  )
