import {SHOPIFY_STORE_ID} from '../constants'

export const collectionUrl = (collectionId: number) => {
  if (!SHOPIFY_STORE_ID) {
    return null
  }
  return `https://${SHOPIFY_STORE_ID}/admin/collections/${collectionId}`
}

export const productUrl = (productId: number) => {
  if (!SHOPIFY_STORE_ID) {
    return null
  }
  return `https://${SHOPIFY_STORE_ID}/admin/products/${productId}`
}

export const productVariantUrl = (productId: number, productVariantId: number) => {
  if (!SHOPIFY_STORE_ID) {
    return null
  }
  return `https://${SHOPIFY_STORE_ID}/admin/products/${productId}/variants/${productVariantId}`
}
