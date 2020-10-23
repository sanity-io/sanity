import {debounceTime, share} from 'rxjs/operators'
import fromEvent from '../utils/fromEvent'

export default fromEvent(window, 'resize', {passive: true}).pipe(debounceTime(200), share())
