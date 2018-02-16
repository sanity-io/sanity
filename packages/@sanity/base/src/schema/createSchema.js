import geopoint from './types/geopoint'
import imageAsset from './types/imageAsset'
import fileAsset from './types/fileAsset'
import Schema from '@sanity/schema'
import legacyRichDate from 'part:@sanity/form-builder/input/legacy-date/schema?'
import validateSchema from '@sanity/schema/lib/sanity/validateSchema'
import groupProblems from '@sanity/schema/lib/sanity/groupProblems'
import {inferFromSchema as inferValidation} from '@sanity/validation'

const isError = problem => problem.severity === 'error'

module.exports = schemaDef => {
  const validated = validateSchema(schemaDef.types).getTypes()

  const validation = groupProblems(validated)
  const hasErrors = validation.some(group => group.problems.some(isError))

  let types = []
  if (!hasErrors) {
    types = [...schemaDef.types, geopoint, legacyRichDate, imageAsset, fileAsset].filter(Boolean)
  }

  const compiled = Schema.compile({
    name: schemaDef.name,
    types
  })

  compiled._source = schemaDef
  compiled._validation = validation

  return inferValidation(compiled)
}
