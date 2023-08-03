import {Schema as SchemaBuilder, type SchemaValidationResult} from '@sanity/schema'
import {validateSchema, groupProblems} from '@sanity/schema/_internal'
import {Schema} from '@sanity/types'
import {inferFromSchema as inferValidation} from '../validation'
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

const isError = (problem: SchemaValidationResult) => problem.severity === 'error'

const builtinTypes = [
  assetSourceData,
  slug,
  geopoint,
  // legacyRichDate,
  imageAsset,
  fileAsset,
  imageCrop,
  imageHotspot,
  imageMetadata,
  imageDimensions,
  imagePalette,
  imagePaletteSwatch,
]

/**
 * @hidden
 * @beta */
export function createSchema(schemaDef: {name: string; types: any[]}): Schema {
  const validated = validateSchema(schemaDef.types).getTypes()
  const validation = groupProblems(validated)
  const hasErrors = validation.some((group) => group.problems.some(isError))

  const compiled = SchemaBuilder.compile({
    name: schemaDef.name,
    types: hasErrors ? [] : [...schemaDef.types, ...builtinTypes].filter(Boolean),
  })

  // ;(compiled as any)._source = schemaDef
  ;(compiled as any)._validation = validation

  return inferValidation(compiled as Schema)
}
