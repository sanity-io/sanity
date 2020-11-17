import {fromEvent} from 'rxjs'
import {share} from 'rxjs/operators'

export default fromEvent(document, 'visibilitychange').pipe(share())
