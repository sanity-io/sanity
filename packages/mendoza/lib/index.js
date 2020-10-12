'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
Object.defineProperty(exports, 'RawPatch', {
  enumerable: true,
  get: function get() {
    return _patch.RawPatch
  },
})
Object.defineProperty(exports, 'RawOperation', {
  enumerable: true,
  get: function get() {
    return _patch.RawOperation
  },
})
Object.defineProperty(exports, 'applyPatch', {
  enumerable: true,
  get: function get() {
    return _simplePatcher.applyPatch
  },
})
exports.incremental = void 0

var incremental = _interopRequireWildcard(require('./incremental-patcher'))

exports.incremental = incremental

var _patch = require('./patch')

var _simplePatcher = require('./simple-patcher')

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null
  var cache = new WeakMap()
  _getRequireWildcardCache = function _getRequireWildcardCache() {
    return cache
  }
  return cache
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj}
  }
  var cache = _getRequireWildcardCache()
  if (cache && cache.has(obj)) {
    return cache.get(obj)
  }
  var newObj = {}
  var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc)
      } else {
        newObj[key] = obj[key]
      }
    }
  }
  newObj.default = obj
  if (cache) {
    cache.set(obj, newObj)
  }
  return newObj
}
