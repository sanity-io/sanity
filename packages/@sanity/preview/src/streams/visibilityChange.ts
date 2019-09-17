import {share} from 'rxjs/operators'
import fromEvent from '../utils/fromEvent'

export default fromEvent(document, 'visibilitychange').pipe(share())
