import {person} from './documents/person'
import {page} from './documents/page'
import {post} from './documents/post'
import {infoSection} from './objects/infoSection'
import {settings} from './singletons/settings'
import {link} from './objects/link'
import {blockContent} from './objects/blockContent'
import button from './objects/button'
import {blockContentTextOnly} from './objects/blockContentTextOnly'

// Commerce studio schema imports
import {productType} from './documents/product'
import {productVariantType} from './documents/productVariant'
import {collectionType} from './documents/collection'
import {colorThemeType} from './documents/colorTheme'

// Shopify object types
import {proxyStringType} from './objects/shopify/proxyStringType'
import {shopifyProductType} from './objects/shopify/shopifyProductType'
import {shopifyProductVariantType} from './objects/shopify/shopifyProductVariantType'
import {shopifyCollectionType} from './objects/shopify/shopifyCollectionType'
import {optionType} from './objects/shopify/optionType'
import {priceRangeType} from './objects/shopify/priceRangeType'
import {inventoryType} from './objects/shopify/inventoryType'
import {collectionRuleType} from './objects/shopify/collectionRuleType'
import {productWithVariantType} from './objects/shopify/productWithVariantType'

// Module object types
import {heroType} from './objects/module/heroType'
import {calloutType} from './objects/module/calloutType'
import {callToActionType} from './objects/module/callToActionType'
import {instagramType} from './objects/module/instagramType'
import {accordionType} from './objects/module/accordionType'
import {accordionGroupType} from './objects/module/accordionGroupType'
import {gridType} from './objects/module/gridType'
import {gridItemType} from './objects/module/gridItemType'
import {imageFeaturesType} from './objects/module/imageFeaturesType'
import {imageFeatureType} from './objects/module/imageFeatureType'
import {imageCallToActionType} from './objects/module/imageCallToActionType'
import {productFeaturesType} from './objects/module/productFeaturesType'
import {productReferenceType} from './objects/module/productReferenceType'

// Link object types
import {linkInternalType} from './objects/link/linkInternalType'
import {linkExternalType} from './objects/link/linkExternalType'
import {linkEmailType} from './objects/link/linkEmailType'
import {linkProductType} from './objects/link/linkProductType'

// Hotspot object types
import {imageWithProductHotspotsType} from './objects/hotspot/imageWithProductHotspotsType'
import {productHotspotsType} from './objects/hotspot/productHotspotsType'
import {spotType} from './objects/hotspot/spotType'

// Other object types
import {seoType} from './objects/seoType'
import {portableTextType} from './portableText/portableTextType'
import {portableTextSimpleType} from './portableText/portableTextSimpleType'

// Export an array of all the schema types.  This is used in the Sanity Studio configuration. https://www.sanity.io/docs/schema-types

export const schemaTypes = [
  // Singletons
  settings,
  // Basic documents
  page,
  post,
  person,
  // Base objects (no dependencies)
  button,
  blockContent,
  blockContentTextOnly,
  infoSection,
  link,
  seoType,
  proxyStringType,
  // Link types (must come before portable text)
  linkInternalType,
  linkExternalType,
  linkEmailType,
  linkProductType,
  // Portable text types (depend on link types)
  portableTextType,
  portableTextSimpleType,
  // Shopify objects
  shopifyProductType,
  shopifyProductVariantType,
  shopifyCollectionType,
  optionType,
  priceRangeType,
  inventoryType,
  collectionRuleType,
  productWithVariantType,
  // Hotspot objects
  imageWithProductHotspotsType,
  productHotspotsType,
  spotType,
  // Module objects (depend on portable text and other objects)
  heroType,
  calloutType,
  callToActionType,
  instagramType,
  accordionType,
  accordionGroupType,
  gridType,
  gridItemType,
  imageFeaturesType,
  imageFeatureType,
  imageCallToActionType,
  productFeaturesType,
  productReferenceType,
  // Commerce documents (depend on all above objects)
  productType,
  productVariantType,
  collectionType,
  colorThemeType,
]
