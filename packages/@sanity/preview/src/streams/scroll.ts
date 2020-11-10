import {fromEvent} from 'rxjs'
import {debounceTime, share} from 'rxjs/operators'

export default fromEvent(window, 'scroll', {passive: true, capture: true}).pipe(
  debounceTime(200),
  share()
)
