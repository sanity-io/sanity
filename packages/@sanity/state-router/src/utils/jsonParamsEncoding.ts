export function decodeJsonParams(pathsegment = '') {
  const segment = decodeURIComponent(pathsegment)
  if (!segment) {
    return {}
  }

  try {
    return JSON.parse(atob(segment))
  } catch (err) {
    // Maybe try the old format (non-base64 encoded)
  }

  try {
    return JSON.parse(segment)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to parse JSON parameters')
  }

  return {}
}

export function encodeJsonParams(params) {
  return params === null || typeof params === 'undefined' ? '' : btoa(JSON.stringify(params))
}
