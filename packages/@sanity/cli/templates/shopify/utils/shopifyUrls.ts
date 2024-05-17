import {SHOPIFY_STORE_ID} from '../constants'

export const collectionUrl = (collectionId: number) => {
  if (!SHOPIFY_STORE_ID) {
    return null
  }
  return `https://admin.shopify.com/store/${SHOPIFY_STORE_ID}/collections/${collectionId}`
}

export const productUrl = (productId: number) => {
  if (!SHOPIFY_STORE_ID) {
    return null
  }
  return `https://admin.shopify.com/store/${SHOPIFY_STORE_ID}/products/${productId}`
}

export const productVariantUrl = (productId: number, productVariantId: number) => {
  if (!SHOPIFY_STORE_ID) {
    return null
  }
  return `https://admin.shopify.com/store/${SHOPIFY_STORE_ID}/products/${productId}/variants/${productVariantId}`
}
