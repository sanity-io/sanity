// document types
import collection from './documents/collection'
import product from './documents/product'
import productVariant from './documents/productVariant'

// objects
import accordion from './objects/accordion'
import callout from './objects/callout'
import productOption from './objects/productOption'
import proxyString from './objects/proxyString'
import shopifyCollection from './objects/shopifyCollection'
import shopifyCollectionRule from './objects/shopifyCollectionRule'
import shopifyProduct from './objects/shopifyProduct'
import shopifyProductVariant from './objects/shopifyProductVariant'

// block content
import blockContent from './blocks/blockContent'

export const schemaTypes = [
  collection,
  product,
  productVariant,
  blockContent,
  accordion,
  callout,
  productOption,
  proxyString,
  shopifyCollection,
  shopifyCollectionRule,
  shopifyProduct,
  shopifyProductVariant,
]
