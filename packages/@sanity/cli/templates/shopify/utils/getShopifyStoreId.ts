import sanityClient from 'part:@sanity/base/client'
import {SANITY_API_VERSION} from '../constants'

const SHOPIFY_SYNC_DOCUMENT_TYPE = 'sanity.shopify.sync'

export const getShopifyStoreId = async () => {
  const storeId = await sanityClient
    .withConfig({apiVersion: SANITY_API_VERSION})
    .fetch(`*[_type == $documentType] | order(_updatedAt desc)[0].store`, {
      documentType: SHOPIFY_SYNC_DOCUMENT_TYPE,
    })

  return storeId
}
