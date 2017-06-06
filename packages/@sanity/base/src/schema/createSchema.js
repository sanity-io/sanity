import geopoint from './types/geopoint'
import richDate from './types/richDate'
import imageAsset from './types/imageAsset'
import fileAsset from './types/fileAsset'
import Schema from '@sanity/schema'
import deprecatedDate from './types/deprecatedDate'

module.exports = schemaDef => Schema.compile({
  name: schemaDef.name,
  types: [...schemaDef.types, geopoint, richDate, deprecatedDate, imageAsset, fileAsset]
})
