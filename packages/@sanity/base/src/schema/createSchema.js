import geopoint from './types/geopoint'
import imageAsset from './types/imageAsset'
import fileAsset from './types/fileAsset'
import Schema from '@sanity/schema'
import legacyRichDate from 'part:@sanity/form-builder/input/legacy-date/schema?'

module.exports = schemaDef => Schema.compile({
  name: schemaDef.name,
  types: [...schemaDef.types, geopoint, legacyRichDate, imageAsset, fileAsset].filter(Boolean)
})
