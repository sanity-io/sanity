import {fromEvent} from 'rxjs'
import {share} from 'rxjs/operators'

export default fromEvent(window, 'orientationchange').pipe(share())
