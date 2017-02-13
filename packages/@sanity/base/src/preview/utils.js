export function prepareValue(value, previewConfig) {
  if (!value) {
    return value
  }

  // todo: validation
  if (!previewConfig) {
    return value
  }

  const remapped = Object.keys(previewConfig.select).reduce((item, selectKey) => {
    item[selectKey] = value[previewConfig.select[selectKey]]
    return item
  }, {})

  if (typeof previewConfig.prepare === 'function') {
    try {
      return previewConfig.prepare(value)
    } catch (error) {
      const message = [
        `Error: Preparing value for preview failed: ${error.message}`,
        'Please verify that your prepare function can tolerate being called with argument %O',
        'The prepare function that failed: %O'
      ].join(' ')
      console.error(message, value, previewConfig.prepare) // eslint-disable-line no-console
    }
  }
  return remapped
}
