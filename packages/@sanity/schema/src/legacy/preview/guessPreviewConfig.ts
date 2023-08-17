import {omitBy, isUndefined} from 'lodash'
import arrify from 'arrify'
import {createFallbackPrepare} from './fallbackPrepare'
import {isBlockField} from './portableText'

const TITLE_CANDIDATES = ['title', 'name', 'label', 'heading', 'header', 'caption']
const DESCRIPTION_CANDIDATES = ['description', ...TITLE_CANDIDATES]

function fieldHasReferenceTo(fieldDef, refType) {
  return arrify(fieldDef.to || []).some((memberTypeDef) => memberTypeDef.type === refType)
}

function isImageAssetField(fieldDef) {
  return fieldHasReferenceTo(fieldDef, 'sanity.imageAsset')
}

function resolveImageAssetPath(typeDef) {
  const fields = typeDef.fields || []
  const imageAssetField = fields.find(isImageAssetField)
  if (imageAssetField) {
    return imageAssetField.name
  }
  const fieldWithImageAsset = fields.find((fieldDef) =>
    (fieldDef.fields || []).some(isImageAssetField),
  )

  return fieldWithImageAsset ? `${fieldWithImageAsset.name}.asset` : undefined
}

function isFileAssetField(fieldDef) {
  return fieldHasReferenceTo(fieldDef, 'sanity.fileAsset')
}

function resolveFileAssetPath(typeDef) {
  const fields = typeDef.fields || []
  const assetField = fields.find(isFileAssetField)
  if (assetField) {
    return assetField.name
  }
  const fieldWithFileAsset = fields.find((fieldDef) =>
    (fieldDef.fields || []).some(isFileAssetField),
  )
  return fieldWithFileAsset ? `${fieldWithFileAsset.name}.asset` : undefined
}

export default function guessPreviewFields(rawObjectTypeDef) {
  const objectTypeDef = {fields: [], ...rawObjectTypeDef}

  const stringFieldNames = objectTypeDef.fields
    .filter((field) => field.type === 'string')
    .map((field) => field.name)

  const blockFieldNames = objectTypeDef.fields.filter(isBlockField).map((field) => field.name)

  // Check if we have fields with names that is listed in candidate fields
  let titleField = TITLE_CANDIDATES.find(
    (candidate) => stringFieldNames.includes(candidate) || blockFieldNames.includes(candidate),
  )

  let descField = DESCRIPTION_CANDIDATES.find(
    (candidate) =>
      candidate !== titleField &&
      (stringFieldNames.includes(candidate) || blockFieldNames.includes(candidate)),
  )

  if (!titleField) {
    // Pick first defined string field
    titleField = stringFieldNames[0] || blockFieldNames[0]
    // Pick next as desc
    descField = stringFieldNames[1] || blockFieldNames[1]
  }

  const mediaField = objectTypeDef.fields.find((field) => field.type === 'image')

  const imageAssetPath = resolveImageAssetPath(objectTypeDef)

  if (!titleField) {
    const fileAssetPath = resolveFileAssetPath(objectTypeDef)
    if (fileAssetPath) {
      titleField = `${fileAssetPath}.originalFilename`
    }
    if (imageAssetPath) {
      titleField = `${imageAssetPath}.originalFilename`
    }
  }

  if (!titleField && !imageAssetPath) {
    // last resort, pick all fields and concat them
    const fieldNames = objectTypeDef.fields.map((field) => field.name)
    const fieldMapping = fieldNames.reduce((acc, fieldName) => {
      acc[fieldName] = fieldName
      return acc
    }, {})

    return {
      select: fieldMapping,
      prepare: createFallbackPrepare(fieldNames),
    }
  }

  const select = omitBy(
    {
      title: titleField,
      description: descField,
      media: mediaField ? mediaField.name : imageAssetPath,
    },
    isUndefined,
  )

  return {
    select: select,
  }
}
