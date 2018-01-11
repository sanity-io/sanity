import fromEvent from '../utils/fromEvent'

export default fromEvent(window, 'orientationchange').share()
