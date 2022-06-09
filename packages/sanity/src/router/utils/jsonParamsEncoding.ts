export function decodeJsonParams(pathsegment = ''): Record<string, unknown> {
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
    console.warn('Failed to parse JSON parameters')
  }

  return {}
}

export function encodeJsonParams(params?: Record<string, unknown>): string {
  return params ? btoa(JSON.stringify(params)) : ''
}
