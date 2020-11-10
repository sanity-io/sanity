import {fromEvent} from 'rxjs'
import {debounceTime, share} from 'rxjs/operators'

export default fromEvent(window, 'resize', {passive: true}).pipe(debounceTime(200), share())
