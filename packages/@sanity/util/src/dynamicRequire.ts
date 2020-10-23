// Prevent webpack from bundling in webpack context,
// use regular node require for unbundled context
declare const __webpack_require__: boolean
declare const __non_webpack_require__: typeof require

/* eslint-disable camelcase, no-undef */
const requireFunc: typeof require =
  typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require

/* eslint-enable camelcase, no-undef */

export default (request) => {
  const mod = requireFunc(request)
  return mod.__esModule && mod.default ? mod.default : mod
}
