const requireFunc =
  typeof __webpack_require__ === 'function'
    ? // Prevent webpack from throwing
      __non_webpack_require__
    : // Allow dynamic requires to work in regular node context
      require

module.exports = request => {
  const mod = requireFunc(request)
  return mod.__esModule && mod.default ? mod.default : mod
}
