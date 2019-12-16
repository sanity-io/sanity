import {IdPair} from '../types'
import {distinctUntilChanged, map} from 'rxjs/operators'
import {documentEventsFor} from './documentEvents'

export function connectionState(idPair: IdPair) {
  return documentEventsFor(idPair).pipe(
    map(event => event.type === 'reconnect'),
    distinctUntilChanged(),
    map(isReconnecting => ({reconnecting: isReconnecting}))
  )
}
