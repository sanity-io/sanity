import blockContent from './blockContent'
import category from './category'
import localeBlockContent from './locale/localeBlockContent'
import localeString from './locale/localeString'
import localeText from './locale/localeText'
import product from './product'
import productVariant from './productVariant'
import vendor from './vendor'

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
