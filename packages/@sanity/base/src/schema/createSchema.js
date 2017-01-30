import geopoint from './types/geopoint'
import imageAsset from './types/imageAsset'
import Schema from '@sanity/schema'
export default schemaDef => {
  return Schema.compile({
    name: schemaDef.name,
    types: [...schemaDef.types, geopoint, imageAsset]
  })
}

