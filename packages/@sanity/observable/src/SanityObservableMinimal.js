const {Observable} = require('rxjs/internal/Observable')
const assign = require('object-assign')
const {map} = require('../operators/map')
const {filter} = require('../operators/filter')
const {reduce} = require('../operators/reduce')

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
  const observable = new SanityObservableMinimal()
  observable.source = this
  observable.operator = operator
  return observable
}

function createDeprecatedMemberOp(name, op) {
  let hasWarned = false
  return function deprecatedOperator() {
    if (!hasWarned) {
      hasWarned = true
      console.warn(
        new Error(
          `Calling observable.${name}(...) is deprecated. Please use observable.pipe(${name}(...)) instead`
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
