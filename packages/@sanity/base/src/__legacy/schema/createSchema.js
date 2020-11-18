import Schema from '@sanity/schema'
import legacyRichDate from 'part:@sanity/form-builder/input/legacy-date/schema?'
import validateSchema from '@sanity/schema/lib/sanity/validateSchema'
import groupProblems from '@sanity/schema/lib/sanity/groupProblems'
import {inferFromSchema as inferValidation} from '@sanity/validation'
import slug from './types/slug'
import geopoint from './types/geopoint'
import imageCrop from './types/imageCrop'
import imageHotspot from './types/imageHotspot'
import assetSourceData from './types/assetSourceData'
import imageAsset from './types/imageAsset'
import imagePalette from './types/imagePalette'
import imagePaletteSwatch from './types/imagePaletteSwatch'
import imageDimensions from './types/imageDimensions'
import imageMetadata from './types/imageMetadata'
import fileAsset from './types/fileAsset'

const isError = (problem) => problem.severity === 'error'

module.exports = (schemaDef) => {
  const validated = validateSchema(schemaDef.types).getTypes()

  const validation = groupProblems(validated)
  const hasErrors = validation.some((group) => group.problems.some(isError))

  let types = []
  if (!hasErrors) {
    types = [
      ...schemaDef.types,
      assetSourceData,
      slug,
      geopoint,
      legacyRichDate,
      imageAsset,
      fileAsset,
      imageCrop,
      imageHotspot,
      imageMetadata,
      imageDimensions,
      imagePalette,
      imagePaletteSwatch,
    ].filter(Boolean)
  }

  const compiled = Schema.compile({
    name: schemaDef.name,
    types,
  })

  compiled._source = schemaDef
  compiled._validation = validation

  return inferValidation(compiled)
}
