'use strict'

var Constants = require('./Constants') // @todo Optimize this to cut down on iteration

var concatWindows = function concatWindows(winA, winB) {
  var end = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Constants.REAR
  var idsInA = winA.map((item) => item._id)
  var itemsToMerge = winB.filter((item) => !idsInA.includes(item._id))
  var items = end === Constants.FRONT ? itemsToMerge.concat(winA) : winA.concat(itemsToMerge)
  return items
}

module.exports = concatWindows
