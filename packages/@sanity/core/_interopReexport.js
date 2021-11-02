/**
 * esm/commonjs interop reexport helper
 * this should be used instead of doing `module.exports = require('./some/file')
 * since that doesn't work properly with esm imports from the consuming end
 * @param moduleExports export object from the exporting module
 * @param importedModule the imported module to be reexported
 */
module.exports = function _interopReexport(moduleExports, importedModule) {
  Object.defineProperty(moduleExports, '__esModule', {
    value: true,
  })

  Object.defineProperty(moduleExports, 'default', {
    enumerable: true,
    get: function get() {
      return importedModule.default
    },
  })

  Object.keys(importedModule).forEach(function (key) {
    if (key === 'default' || key === '__esModule') return
    if (key in moduleExports && moduleExports[key] === importedModule[key]) return
    Object.defineProperty(moduleExports, key, {
      enumerable: true,
      get: function get() {
        return importedModule[key]
      },
    })
  })
}
