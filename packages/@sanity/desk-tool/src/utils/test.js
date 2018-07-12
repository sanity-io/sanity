const {from: observableFrom, of: observableOf} = require('rxjs')
const {mergeMap} = require('rxjs/operators')

// Ignore me:
const log = type => val => console.log(type, val)

const isPromiseOrObservable = thing =>
  thing && (typeof thing.then === 'function' || typeof thing.subscribe === 'function')

function serialize(item, context) {
  // Lazy
  if (typeof item === 'function') {
    return serialize(item(), context)
  }

  // Promise/observable returning a function, builder or plain JSON structure
  if (isPromiseOrObservable(item)) {
    // What's this one called again?
    return observableFrom(item).pipe(mergeMap(val => serialize(val, context)))
  }

  // Builder?
  if (typeof item.serialize === 'function') {
    return serialize(item.serialize(context))
  }

  // Plain value?
  return observableOf(item)
}

const value = {plain: 'value'}
const builder = {serialize: () => value}
const context = {path: ['foo', 'bar']}

async function run() {
  serialize(value, context).subscribe(log('plain'))
  serialize(Promise.resolve(value), context).subscribe(log('promise'))
  serialize(observableOf(value), context).subscribe(log('observable'))
  serialize(builder, context).subscribe(log('builder'))

  await delay()

  serialize(() => value, context).subscribe(log('func plain'))
  serialize(() => Promise.resolve(value), context).subscribe(log('func promise'))
  serialize(() => observableOf(value), context).subscribe(log('func observable'))
  serialize(() => builder, context).subscribe(log('func builder'))

  await delay()

  serialize(Promise.resolve(() => value), context).subscribe(log('promise func'))
  serialize(observableOf(() => value), context).subscribe(log('observable func'))

  await delay()

  serialize(() => delay().then(() => observableOf(() => () => builder))).subscribe(
    log('func => promise => observable => func => func => builder')
  )
}

run()

// Not relevant
function delay() {
  return new Promise(resolve => setTimeout(() => console.log('') || resolve(), 25))
}
