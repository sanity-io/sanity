import {IdPair} from '../types'
import {documentPairEventsFor} from './documentEvents'
import {distinctUntilChanged, map} from 'rxjs/operators'

export function connectionStateOf(idPair: IdPair) {
  return documentPairEventsFor(idPair).pipe(
    map(event => event.type === 'reconnect'),
    distinctUntilChanged(),
    map(isReconnecting => ({reconnecting: isReconnecting}))
  )
}
