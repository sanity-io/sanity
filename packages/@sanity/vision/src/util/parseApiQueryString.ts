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
      // Defined rather than assigned: `$__proto__` is a valid GROQ parameter, and assigning that
      // key would set the object's prototype instead of adding the parameter
      Object.defineProperty(params, key.slice(1), {
        value: JSON.parse(value),
        enumerable: true,
        configurable: true,
        writable: true,
      })
      continue
    }

    if (key === 'perspective') {
      options[key] = value
      continue
    }
  }

  return {query: qs.get('query') || '', params, options}
}
