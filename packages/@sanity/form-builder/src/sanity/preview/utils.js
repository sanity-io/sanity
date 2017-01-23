import guessPreviewFields from './guessPreviewFields'
import {isPlainObject} from 'lodash'

export function stringifyGradientQuerySelection(fields) {
  const prelude = '_id, _type, "_isPreviewMaterializedHack": _id'
  if (Array.isArray(fields)) {
    return `${prelude}, ${fields.join(',')}`
  }

  const selectors = Object.keys(fields).map(key => {
    if (typeof fields[key] === 'undefined') {
      return null
    }
    return `"${key}":${fields[key]}`
  })
    .filter(Boolean)
    .join(',')
  return `${prelude}, ${selectors}`
}

export function canonicalizePreviewConfig(type) {
  const schemaPreviewConfig = (type.options || {}).preview || {
    fields: guessPreviewFields(type)
  }

  return {
    ...schemaPreviewConfig,
    fields: schemaPreviewConfig.fields
  }
}

export function prepareValue(value, previewConfig) {
  if (!value) {
    return value
  }
  // todo: validation
  if (!previewConfig) {
    return value
  }

  if (typeof previewConfig.prepare === 'function') {
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

  if (isPlainObject(previewConfig.fields) && !value._isPreviewMaterializedHack) {
    return Object.keys(previewConfig.fields).reduce((item, fieldKey) => {
      item[fieldKey] = value[previewConfig.fields[fieldKey]]
      return item
    }, {})
  }

  return value
}
