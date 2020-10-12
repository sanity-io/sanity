'use strict'

var dotProp = require('dot-prop')
/* eslint-disable id-length, complexity */

module.exports = (arr, sorting) =>
  arr.slice().sort((itemA, itemB) => {
    var ret = 0
    sorting.some((sort) => {
      var desc = sort[1] === 'desc'
      var x = dotProp.get(itemA, sort[0])
      var y = dotProp.get(itemB, sort[0])

      if (x === y) {
        ret = 0
        return false
      }

      if (y === null) {
        ret = desc ? 1 : -1
        return true
      }

      if (x === null) {
        ret = desc ? -1 : 1
        return true
      }

      if (typeof x === 'string' && typeof y === 'string') {
        ret = desc ? y.localeCompare(x) : x.localeCompare(y)
        return ret !== 0
      }

      if (desc) {
        ret = x < y ? 1 : -1
      } else {
        ret = x < y ? -1 : 1
      }

      return true
    })
    return ret
  })
