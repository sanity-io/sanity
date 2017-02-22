import Observable from '@sanity/observable'

function getWindowDimensions() {
  return {
    height: window.innerHeight,
    width: window.innerWidth
  }
}

const EVENTS = ['scroll', 'resize']

const scrollObserver = new Observable(observer => {
  const listener = () => observer.next(getWindowDimensions())
  EVENTS.forEach(eventType => {
    document.body.addEventListener(eventType, listener, true)
  })

  return () => {
    EVENTS.forEach(eventType => {
      document.body.removeEventListener(eventType, listener, true)
    })
  }
})
  .debounceTime(100)
  .share()

export default new Observable(observer => {
  observer.next(getWindowDimensions())
  return scrollObserver.subscribe(observer)
})
