const enc = encodeURIComponent

module.exports = ({query, params = {}, options = {}}) => {
  const qString = Object.keys(params).reduce((qs, param) =>
    `${qs}&${enc(`$${param}`)}=${enc(JSON.stringify(params[param]))}`,
    `?query=${enc(query)}`
  )

  return Object.keys(options).reduce((qs, option) => {
    // Only include the option if it is truthy
    return options[option]
      ? `${qs}&${enc(option)}=${enc(options[option])}`
      : qs
  }, qString)
}
