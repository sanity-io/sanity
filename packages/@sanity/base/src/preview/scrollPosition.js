import Observable from '@sanity/observable'
import {debounce} from 'lodash'

// A useful pattern that can be re-used probably
function createListener(target, eventTypes, useCapture) {
  const listeners = []
  return {
    add(listener) {
      if (listeners.length === 0) {
        start()
      }
      listeners.push(listener)
      return () => remove(listener)
    },
    remove: remove
  }

  function remove(listener) {
    const idx = listeners.indexOf(listener)
    if (idx > -1) {
      listeners.splice(idx, 1)
      if (listeners.length == 0) {
        stop()
      }
    }
  }
  function emit(event) {
    listeners.forEach(listener => listener(event))
  }
  function start() {
    eventTypes.forEach(eventType => {
      target.addEventListener(eventType, emit, useCapture)
    })
  }
  function stop() {
    eventTypes.forEach(eventType => {
      target.removeEventListener(eventType, emit, useCapture)
    })
  }
}

const events = createListener(document.body, ['scroll', 'resize'], true)

function getWindowDimensions() {
  return {
    height: window.innerHeight,
    width: window.innerWidth
  }
}

export default new Observable(observer => {
  observer.next(getWindowDimensions())

  return events.add(debounce(() => observer.next(getWindowDimensions()), 200))
})
