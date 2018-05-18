import fromEvent from '../utils/fromEvent'
import {share} from 'rxjs/operators'

export default fromEvent(document, 'visibilitychange').pipe(share())
