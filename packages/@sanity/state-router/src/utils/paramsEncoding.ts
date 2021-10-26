export function decodeParams(pathSegment: string): Record<string, string> {
  return pathSegment.split(';').reduce<Record<string, string>>((params, pair) => {
    const [key, value] = pair.split('=')
    params[decodeURIComponent(key)] = decodeURIComponent(value)
    return params
  }, {})
}

export function encodeParams(params: Record<string, string>): string {
  return Object.keys(params)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join(';')
}
