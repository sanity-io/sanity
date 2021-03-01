// Todo: refactor out
import pubsub from 'nano-pubsub'
import {Observable} from 'rxjs'

export default function createActions(actions: Record<string, Function>) {
  return Object.keys(actions).reduce((acc, name) => {
    acc[name] = createAction(name, actions[name])
    return acc
  }, {})
}

interface Call {
  name: string
  progress: any
  returnValue: any
  args: any[]
}

function createAction(name: string, fn: Function) {
  const calls = pubsub<Call>()

  // eslint-disable-next-line func-name-matching
  const functor = function action(...args) {
    const retValue = fn(...args)

    calls.publish({
      name: name,
      progress: retValue.progress,
      returnValue: retValue,
      args: args,
    })

    return retValue
  }

  functor.calls = new Observable((observer) => {
    return calls.subscribe((call) => {
      observer.next(call)
    })
  })

  return functor
}
