import {share} from 'rxjs/operators'
import fromEvent from '../utils/fromEvent'

export default fromEvent(window, 'orientationchange').pipe(share())
