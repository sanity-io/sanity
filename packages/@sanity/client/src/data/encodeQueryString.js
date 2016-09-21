const enc = encodeURIComponent

module.exports = ({query, params = {}}) => {
  if (params.query) {
    throw new Error('Parameter "query" is reserved, cannot be used as a parameter')
  }

  return Object.keys(params).reduce((qs, param) =>
    `${qs}&${enc(param)}=${enc(JSON.stringify(params[param]))}`,
    `?query=${enc(query)}`
  )
}
