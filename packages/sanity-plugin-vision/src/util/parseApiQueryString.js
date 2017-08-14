export default function parseApiQueryString(qs) {
  const params = Object.keys(qs)
    .filter(key => key[0] === '$')
    .reduce((keep, key) => {
      keep[key.substr(1)] = JSON.parse(qs[key])
      return keep
    }, {})

  return {query: qs.query, params}
}
