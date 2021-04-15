export default (result, prefix) => {
  return Object.keys(result).reduce((acc, key) => {
    acc[key] = result[key].map((err) => err.prefixPaths(prefix))
    return acc
  }, {})
}
