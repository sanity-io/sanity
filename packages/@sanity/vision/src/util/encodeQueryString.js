const enc = encodeURIComponent

export function encodeQueryString(query, params = {}) {
  return Object.keys(params).reduce(
    (qs, param) => `${qs}&${enc(`$${param}`)}=${enc(JSON.stringify(params[param]))}`,
    `?query=${enc(query)}`
  )
}
