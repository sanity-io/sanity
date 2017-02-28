import Observable from '@sanity/observable'

import fromEvent from '../utils/fromEvent'

function getViewport() {
  return {
    height: window.innerHeight,
    width: window.innerWidth
  }
}

const resizeEvents = fromEvent(window, 'resize').share()

export default new Observable(observer => {
  observer.next(getViewport())
  return resizeEvents.map(getViewport).subscribe(observer)
})
