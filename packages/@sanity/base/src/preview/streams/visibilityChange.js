import fromEvent from '../utils/fromEvent'

export default fromEvent(document, 'visibilitychange').share()
