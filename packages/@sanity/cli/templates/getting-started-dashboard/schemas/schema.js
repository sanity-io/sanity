// First, we must import the schema creator
import createSchema from 'part:@sanity/base/schema-creator'

// Then import schema types from any plugins that might expose them
import schemaTypes from 'all:part:@sanity/base/schema-type'
import siteSettings from './siteSettings'
import pet from './pet'
import human from './human'
import product from './product'
import article from './article'
import link from './link'
import simpleBlockContent from './simpleBlockContent'

// Then we give our schema to the builder and provide the result to Sanity
export default createSchema({
  name: 'default',
  types: schemaTypes.concat([simpleBlockContent, siteSettings, pet, human, product, article, link]),
})
