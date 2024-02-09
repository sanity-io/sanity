import blockContent from './blockContent'
import category from './category'
import product from './product'
import vendor from './vendor'
import productVariant from './productVariant'

import localeString from './locale/localeString'
import localeText from './locale/localeText'
import localeBlockContent from './locale/localeBlockContent'

export const schemaTypes = [
  // Document types
  product,
  vendor,
  category,

  // Other types
  blockContent,
  localeText,
  localeBlockContent,
  localeString,
  productVariant,
]
