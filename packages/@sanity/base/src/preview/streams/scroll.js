import fromEvent from '../utils/fromEvent'

export default fromEvent(window, 'scroll', {passive: true, capture: true})
  .debounceTime(200)
  .share()
