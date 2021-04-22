import {Schema} from '@sanity/types'
import getDefaultModule from './getDefaultModule'

// We are lazy-loading the part to work around typescript trying to resolve it
const getDefaultSchema = (): Schema => {
  const schema: Schema = getDefaultModule(require('part:@sanity/base/schema'))
  return schema
}

export {Schema, getDefaultSchema}
