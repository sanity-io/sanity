export function decodeParams(pathSegment: string): Record<string, string> {
  return pathSegment.split(';').reduce<Record<string, string>>((params, pair) => {
    const [key, value] = pair.split('=')

    params[decodeURIComponent(key)] = decodeURIComponent(value)

    return params
  }, {})
}

export function encodeParams(params: Record<string, string | undefined | null>): string {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
    .join(';')
}
