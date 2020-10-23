// Prevent webpack from bundling in webpack context,
// use regular node require for unbundled context

/* eslint-disable camelcase, no-undef */
const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require
/* eslint-enable camelcase, no-undef */

const dynamicRequire = (request) => {
  const mod = requireFunc(request)
  return mod.__esModule && mod.default ? mod.default : mod
}

dynamicRequire.resolve = requireFunc.resolve

module.exports = dynamicRequire
