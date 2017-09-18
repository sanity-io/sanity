import geopoint from './types/geopoint'
import imageAsset from './types/imageAsset'
import fileAsset from './types/fileAsset'
import Schema from '@sanity/schema'

module.exports = schemaDef => Schema.compile({
  name: schemaDef.name,
  types: [...schemaDef.types, geopoint, imageAsset, fileAsset]
})
