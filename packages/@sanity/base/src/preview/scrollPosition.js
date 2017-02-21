import Observable from '@sanity/observable'

function getWindowDimensions() {
  return {
    height: window.innerHeight,
    width: window.innerWidth
  }
}

const EVENTS = ['scroll', 'resize']
export default new Observable(observer => {
  const listener = () => observer.next(getWindowDimensions())

  listener()

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
