import Observable from '@sanity/observable'

export default function fromEvent(target, eventType, useCapture) {
  return new Observable(observer => {
    const listener = event => observer.next(event)
    target.addEventListener(eventType, listener, useCapture)
    return () => {
      target.removeEventListener(eventType, listener, useCapture)
    }
  })
}
