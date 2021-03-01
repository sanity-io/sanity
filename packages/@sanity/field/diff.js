'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})

var _diff = require('./lib/diff')

Object.keys(_diff).forEach(function (key) {
  if (key === 'default' || key === '__esModule') return
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _diff[key]
    },
  })
})
