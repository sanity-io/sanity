export interface ParsedApiQueryString {
  query: string
  params: Record<string, unknown>
  options: Record<string, string>
}

export function parseApiQueryString(qs: URLSearchParams): ParsedApiQueryString {
  const params: Record<string, unknown> = {}
  const options: Record<string, string> = {}

  for (const [key, value] of qs.entries()) {
    if (key[0] === '$') {
      params[key.slice(1)] = JSON.parse(value)
      continue
    }

    if (key === 'perspective') {
      options[key] = value
      continue
    }
  }

  return {query: qs.get('query') || '', params, options}
}
