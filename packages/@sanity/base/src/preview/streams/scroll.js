import fromEvent from '../utils/fromEvent'

export default fromEvent(document.body, 'scroll', true)
  .share()
  .merge(fromEvent(window, 'scroll', true).share())
