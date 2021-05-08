const enc = encodeURIComponent

module.exports = ({query, params = {}, options = {}}) => {
  // We generally want tag at the start of the query string
  const {tag, ...opts} = options
  const q = `query=${enc(query)}`
  const base = tag ? `?tag=${enc(tag)}&${q}` : `?${q}`

  const qString = Object.keys(params).reduce(
    (qs, param) => `${qs}&${enc(`$${param}`)}=${enc(JSON.stringify(params[param]))}`,
    base
  )

  return Object.keys(opts).reduce((qs, option) => {
    // Only include the option if it is truthy
    return options[option] ? `${qs}&${enc(option)}=${enc(options[option])}` : qs
  }, qString)
}
