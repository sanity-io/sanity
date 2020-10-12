'use strict'

var _require = require('rxjs/internal/Observable'),
  Observable = _require.Observable

var assign = require('object-assign')

var _require2 = require('../operators/map'),
  map = _require2.map

var _require3 = require('../operators/filter'),
  filter = _require3.filter

var _require4 = require('../operators/reduce'),
  reduce = _require4.reduce
/*
 A minimal rxjs based observable that align as closely as possible with the current es-observable spec,
 without the static factory methods
 */

function SanityObservableMinimal() {
  Observable.apply(this, arguments) // eslint-disable-line prefer-rest-params
}

SanityObservableMinimal.prototype = Object.create(assign(Object.create(null), Observable.prototype))
Object.defineProperty(SanityObservableMinimal.prototype, 'constructor', {
  value: SanityObservableMinimal,
  enumerable: false,
  writable: true,
  configurable: true,
})

SanityObservableMinimal.prototype.lift = function lift(operator) {
  var observable = new SanityObservableMinimal()
  observable.source = this
  observable.operator = operator
  return observable
}

function createDeprecatedMemberOp(name, op) {
  var hasWarned = false
  return function deprecatedOperator() {
    if (!hasWarned) {
      hasWarned = true
      console.warn(
        new Error(
          'Calling observable.'
            .concat(name, '(...) is deprecated. Please use observable.pipe(')
            .concat(name, '(...)) instead')
        )
      )
    }

    return this.pipe(op.apply(this, arguments))
  }
}

SanityObservableMinimal.prototype.map = createDeprecatedMemberOp('map', map)
SanityObservableMinimal.prototype.filter = createDeprecatedMemberOp('filter', filter)
SanityObservableMinimal.prototype.reduce = createDeprecatedMemberOp('filter', reduce)
module.exports = SanityObservableMinimal
