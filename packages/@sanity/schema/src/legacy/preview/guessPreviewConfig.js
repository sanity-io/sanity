import {omitBy, isUndefined} from 'lodash'
import arrify from 'arrify'
import {createFallbackPrepare} from './fallbackPrepare'

const TITLE_CANDIDATES = ['title', 'name', 'label', 'heading', 'header', 'caption']
const DESCRIPTION_CANDIDATES = ['description', ...TITLE_CANDIDATES]

function is(typeName, type) {
  return type.name === typeName || (type.type && is(typeName, type.type))
}


function fieldHasReferenceTo(fieldType, refTypeName) {
  return arrify(fieldType.to || []).some(memberType => is(refTypeName, memberType))
}

function isImageAssetField(field) {
  return fieldHasReferenceTo(field.type, 'sanity.imageAsset')
}

function resolveFieldWithImageAsset(fields) {
  const imageAssetField = fields.find(isImageAssetField)
  if (imageAssetField) {
    return imageAssetField.name
  }
  const fieldWithImageAsset = fields.find(field => (field.type.fields || []).some(isImageAssetField))

  return fieldWithImageAsset ? fieldWithImageAsset.name : undefined
}

function isFileAssetField(field) {
  return fieldHasReferenceTo(field, 'sanity.fileAsset')
}

function resolveFieldWithFileAsset(fields) {
  const imageAssetField = fields.find(isFileAssetField)
  if (imageAssetField) {
    return imageAssetField.name
  }
  const fieldWithImageAsset = fields.find(field => (field.type.fields || []).some(isFileAssetField))

  return fieldWithImageAsset ? fieldWithImageAsset.name : undefined
}

export default function guessPreviewFields(fields) {

  const stringFieldNames = fields
    .filter(field => is('string', field.type))
    .map(field => field.name)

  // Check if we have fields with names that is listed in candidate fields
  let titleField = TITLE_CANDIDATES
    .find(candidate => stringFieldNames.includes(candidate))

  let descField = DESCRIPTION_CANDIDATES
    .find(candidate => candidate !== titleField && stringFieldNames.includes(candidate))

  if (!titleField) {
    // Pick first defined string field
    titleField = stringFieldNames[0]
    // Pick next as desc
    descField = stringFieldNames[1]
  }

  const fieldWithImageAsset = resolveFieldWithImageAsset(fields)

  if (!titleField) {
    const fieldWithFileAsset = resolveFieldWithFileAsset(fields)
    if (fieldWithFileAsset) {
      titleField = `${fieldWithFileAsset}.asset.originalFilename`
    }
    if (fieldWithImageAsset) {
      titleField = `${fieldWithImageAsset}.asset.originalFilename`
    }
  }

  if (!titleField && !fieldWithImageAsset) {
    // last resort, pick all fields and concat them
    const fieldNames = fields.map(field => field.name)
    const fieldMapping = fieldNames.reduce((acc, fieldName) => {
      acc[fieldName] = fieldName
      return acc
    }, {})

    return {
      select: fieldMapping,
      prepare: createFallbackPrepare(fieldNames)
    }
  }

  const select = omitBy({
    title: titleField,
    description: descField,
    media: fieldWithImageAsset
  }, isUndefined)

  return {
    select: select
  }

}
