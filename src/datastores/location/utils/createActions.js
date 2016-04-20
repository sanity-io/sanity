// Todo: refactor out
import pubsubber from './pubsubber'
import Observable from './SanityStoreObservable'

export default function createActions(actions) {
  return Object.keys(actions).reduce((acc, name) => {
    acc[name] = createAction(name, actions[name])
    return acc
  }, {})
}

function createAction(name, fn) {

  const calls = pubsubber()

  const functor = function action(...args) {
    const retValue = fn(...args)

    calls.publish({
      name: name,
      progress: retValue.progress,
      returnValue: retValue,
      args: args
    })

    return retValue
  }

  functor.calls = new Observable(observer => {
    return calls.subscribe(call => {
      observer.next(call)
    })
  })

  return functor
}
