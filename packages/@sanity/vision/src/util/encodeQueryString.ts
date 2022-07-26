const enc = encodeURIComponent

export function encodeQueryString(query: string, params: Record<string, unknown> = {}): string {
  return Object.keys(params).reduce(
    (qs, param) => `${qs}&${enc(`$${param}`)}=${enc(JSON.stringify(params[param]))}`,
    `?query=${enc(query)}`
  )
}
