import {debounce} from 'lodash'
import createPubsub from 'nano-pubsub'
import {Reported} from './types'

export function createStore<Value>() {
  const reportedValues = new Map<string, Value>()
  const {publish, subscribe} = createPubsub<Reported<Value>[]>()

  const debouncedPublish = debounce(publish, 10, {trailing: true})
  const read = () => Array.from(reportedValues.entries())

  function add(id: string, value: Value) {
    if (reportedValues.has(id)) {
      // eslint-disable-next-line no-console
      // console.error(
      //   new Error(
      //     `Invalid call to useReporter(${id}): A component reporting on "${id}" is already mounted in the subtree. Make sure that all reporters within the same <Tracker> subtree have unique ids.`
      //   )
      // )
    }
    reportedValues.set(id, value)
    debouncedPublish(read())
  }

  function update(id: string, value: Value) {
    if (!reportedValues.has(id)) {
      // throw new Error(`A reporter with id "${id}" is not known.`)
    }
    reportedValues.set(id, value)
    debouncedPublish(read())
  }

  function remove(id: string) {
    if (!reportedValues.has(id)) {
      // throw new Error(`A reporter with id "${id}" is not known`)
    }
    reportedValues.delete(id)
    debouncedPublish(read())
  }

  return {
    add,
    remove,
    update,
    read,
    subscribe,
  }
}
