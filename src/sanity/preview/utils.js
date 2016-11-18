import guessPreviewFields from './guessPreviewFields'
import {uniq} from 'lodash'

function objectify(arrayOrObject) {
  if (Array.isArray(arrayOrObject)) {
    return arrayOrObject.reduce((objectified, key) => {
      objectified[key] = key
      return objectified
    }, {})
  }
  return arrayOrObject
}
// Ensure _id is in the list
export function toGradientQuerySelection(fields) {
  return {_id: '_id', '_isPreviewMaterializedHack': '_id', ...objectify(fields)}
}

export function stringifyGradientQuerySelection(fields) {
  if (Array.isArray(fields)) {
    return fields.join(',')
  }
  return Object.keys(fields).map(key => {
    if (typeof fields[key] === 'undefined') {
      return null
    }
    return `"${key}":${fields[key]}`
  })
    .filter(Boolean)
    .join(',')
}

export function canonicalizePreviewConfig(type) {
  const schemaPreviewConfig = (type.options || {}).preview || {
    fields: guessPreviewFields(type)
  }

  return {
    ...schemaPreviewConfig,
    fields: toGradientQuerySelection(schemaPreviewConfig.fields)
  }
}

export function prepareValue(value, previewConfig) {
  if (!value) {
    return value
  }
  // todo: validation
  if (!previewConfig || !previewConfig.prepare) {
    return value
  }
  try {
    /* todo:
     only pass down selected fields to prepare. Might be hard because the select part is free form, and can
     contain custom datastore query syntax
     const properties = Array.isArray(previewConfig.fields) ? previewConfig.fields : Object.keys(previewConfig.fields)
     const valueWithProps = pick(value, properties)
     */
    return previewConfig.prepare(value)
  } catch (error) {
    const message = [
      `Error: Preparing value for preview failed: ${error.message}`,
      'Please verify that your prepare function can tolerate being called with argument %O',
      'The prepare function that failed: %O'
    ].join(' ')
    console.error(message, value, previewConfig.prepare) // eslint-disable-line no-console
    return value
  }
}
