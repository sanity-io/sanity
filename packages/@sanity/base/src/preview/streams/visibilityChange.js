import Observable from '@sanity/observable'

import fromEvent from '../utils/fromEvent'

function isVisible() {
  return !document.hidden
}

const visibilityChange = fromEvent(document, 'visibilitychange').share()

export default new Observable(observer => {
  observer.next(isVisible())
  return visibilityChange.map(isVisible).subscribe(observer)
})
