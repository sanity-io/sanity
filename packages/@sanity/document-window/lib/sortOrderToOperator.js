'use strict'

var operators = {
  asc: '>',
  desc: '<',
}
var inverted = {
  asc: '<',
  desc: '>',
}

module.exports = (order, options) => {
  var invert = options.invert,
    orEqual = options.orEqual
  var suffix = orEqual ? '=' : ''
  var source = invert ? inverted : operators
  return ''.concat(source[order]).concat(suffix)
}
