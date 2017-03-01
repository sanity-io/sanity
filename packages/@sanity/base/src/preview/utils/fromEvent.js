import Observable from '@sanity/observable'

let supportsPassive = () => {
  supportsPassive = () => false
  try {
    const options = Object.defineProperty({}, 'passive', {
      get() {
        supportsPassive = () => true
      }
    })
    window.addEventListener('test', null, options)
    window.removeEventListener('test', null, options)
  } catch (e) {} // eslint-disable-line no-empty
  return supportsPassive()
}

export default function fromEvent(target, eventType, options) {
  if (typeof options === 'boolean') {
    throw new TypeError('The third argument to fromEvent(..) should be an EventListenerOptions object, not a boolean')
  }
  let compatOptions = options
  if (options && !supportsPassive()) {
    // eslint-disable-next-line no-console
    console.warn('This browser does not support EventListenerOptions, only `options.capture` will be used when calling addEventListener')
    compatOptions = options.capture
  }
  return new Observable(observer => {
    const listener = event => observer.next(event)
    target.addEventListener(eventType, listener, compatOptions)
    // console.log('add', eventType, options)
    return () => {
      // console.log('remove', eventType, options)
      target.removeEventListener(eventType, listener, compatOptions)
    }
  })
}
