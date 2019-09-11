import {debounceTime, share} from 'rxjs/operators'
import fromEvent from '../utils/fromEvent'

export default fromEvent(window, 'scroll', {passive: true, capture: true}).pipe(
  debounceTime(200),
  share()
)
