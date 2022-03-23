/**
 * Re-export helper. This should be used instead of doing:
 * ```js
 * module.exports = require('./some/file')`
 * ```
 */
export const _reExportHelperSnippet = `'use strict'

module.exports = function _reExport(_exports, _sourceModule) {
  Object.defineProperty(_exports, '__esModule', {
    value: true,
  })

  Object.keys(_sourceModule).forEach(function (key) {
    if (key === '__esModule') return
    if (key in _exports && _exports[key] === _sourceModule[key]) return

    Object.defineProperty(_exports, key, {
      enumerable: true,
      get: function () {
        return _sourceModule[key]
      },
    })
  })
}
`
