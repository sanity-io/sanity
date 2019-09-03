export function decodeJsonParams(pathsegment = '') {
  const segment = decodeURIComponent(pathsegment)
  if (!segment) {
    return {}
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
  return JSON.stringify(params)
}
