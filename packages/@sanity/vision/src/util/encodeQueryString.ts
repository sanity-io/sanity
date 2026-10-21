/**
 * The search params of a query request as `@sanity/client` writes them (`encodeQueryString` in
 * its `src/data`): the query, then each param as `$name` with its value as JSON, then the
 * options. A param whose value is `undefined` is left out, as the client leaves it out.
 */
export function encodeQueryString(
  query: string,
  params: Record<string, unknown> = {},
  options: Record<string, string | string[]> = {},
): string {
  const searchParams = new URLSearchParams()
  searchParams.set('query', query)

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) searchParams.set(`$${key}`, JSON.stringify(value))
  }

  for (const [key, value] of Object.entries(options)) {
    if (value) searchParams.set(key, `${value}`)
  }

  return `?${searchParams}`
}
