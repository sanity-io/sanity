import {merge} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import {IdPair} from '../types'
import {cachedPair} from './cachedPair'

// A stream of all events related to either published or draft, each event comes with a 'target'
// that specifies which version (draft|published) the event is about
export function documentEventsFor(idPair: IdPair) {
  return cachedPair(idPair).pipe(
    switchMap(({draft, published}) => merge(draft.events, published.events))
  )
}
