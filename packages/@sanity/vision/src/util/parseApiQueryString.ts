export interface ParsedApiQueryString {
  query: string
  params: Record<string, unknown>
}

export function parseApiQueryString(qs: URLSearchParams): ParsedApiQueryString {
  const params: Record<string, unknown> = {}
  for (const [key, value] of qs.entries()) {
    if (key[0] === '$') {
      params[key.slice(1)] = JSON.parse(value)
    }
  }

  return {query: qs.get('query') || '', params}
}
