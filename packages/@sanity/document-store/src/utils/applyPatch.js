module.exports = function applyPatch(document, patch) {
  const override = Object.keys(patch).reduce((props, key) => {
    props[key] = patch[key].$set
    return props
  }, {})
  return Object.assign({}, document, override)
}