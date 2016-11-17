import guessPreviewFields from './guessPreviewFields'
// Ensure _id is in the list
export function toGradientQuerySelection(fields) {
  if (Array.isArray(fields)) {
    if (!fields.includes('_id')) {
      return ['_id', ...fields]
    }
  }
  return '_id' in fields ? fields : {_id: '_id', ...fields}
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
  // todo: validation
  if (!previewConfig || !previewConfig.prepare) {
    return value
  }
  /* todo:
   only pass down selected fields to document. Might be hard because the select part is free form, and can
   contain custom datastore query syntax
   */
  // const properties = Array.isArray(previewConfig.fields) ? previewConfig.fields : Object.keys(previewConfig.fields)
  // const valueWithProps = pick(value, properties)
  return typeof previewConfig.prepare === 'function' ? previewConfig.prepare(value) : value
}
