import fromEvent from '../utils/fromEvent'
import {debounceTime, share} from 'rxjs/operators'

export default fromEvent(window, 'resize', {passive: true}).pipe(
  debounceTime(200),
  share()
)
