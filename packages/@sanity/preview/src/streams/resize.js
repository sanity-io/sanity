import fromEvent from '../utils/fromEvent'

export default fromEvent(window, 'resize', {passive: true})
  .debounceTime(200)
  .share()
