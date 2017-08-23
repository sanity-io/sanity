import {omitBy, isUndefined} from 'lodash'
import arrify from 'arrify'

const TITLE_CANDIDATES = ['title', 'name', 'label', 'heading', 'header', 'caption']
const DESCRIPTION_CANDIDATES = ['description', ...TITLE_CANDIDATES]

function isImageField(fieldDef) {
  return fieldDef.type === 'image'
}

function isImageAssetField(fieldDef) {
  return fieldDef.type === 'reference'
    && arrify(fieldDef.to).some(memberTypeDef => memberTypeDef.type === 'imageAsset')
}

function resolveImageAssetPath(fieldDefs) {
  const found = fieldDefs.find(field => isImageAssetField(field) || isImageField(field))
  return found && (isImageField(found) ? `${found.name}.asset.url` : `${found.name}.url`)
}

export default function guessPreviewFields(objectTypeDef) {

  const stringFieldNames = objectTypeDef.fields
    .filter(field => field.type === 'string')
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

  const imageAssetPath = resolveImageAssetPath(objectTypeDef.fields)

  if (!titleField && !imageAssetPath) {
    // last resort, pick all fields and concat them
    const fieldNames = objectTypeDef.fields.map(field => field.name)
    const fieldMapping = fieldNames.reduce((acc, fieldName) => {
      acc[fieldName] = fieldName
      return acc
    }, {})

    return {
      select: fieldMapping,
      prepare(data) {
        return {
          title: fieldNames.map(name => `${name}: ${JSON.stringify(data[name])}`).join(' / ')
        }
      }
    }
  }

  const select = omitBy({
    title: titleField,
    description: descField,
    imageUrl: imageAssetPath
  }, isUndefined)

  return {
    select: select
  }

}
