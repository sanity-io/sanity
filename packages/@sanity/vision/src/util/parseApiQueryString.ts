export function parseApiQueryString(
  qs: Record<string, string | unknown>
): {query: unknown; params: Record<string, unknown>} {
  const params = Object.keys(qs)
    .filter((key) => key[0] === '$')
    .reduce((keep, key) => {
      const val = qs[key]

      if (typeof val === 'string') {
        keep[key.substr(1)] = JSON.parse(val)
      }
      return keep
    }, {})

  return {query: qs.query, params}
}
