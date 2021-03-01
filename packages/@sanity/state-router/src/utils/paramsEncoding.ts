export function decodeParams(pathsegment) {
  return pathsegment.split(';').reduce((params, pair) => {
    const [key, value] = pair.split('=')
    params[key] = value
    return params
  }, {})
}

export function encodeParams(params) {
  return Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join(';')
}
