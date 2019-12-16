import {merge, Observable} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import {IdPair} from '../types'
import {BufferedDocumentEvent} from '../buffered-doc/createBufferedDocument'
import {cachedPair} from './cachedPair'

type BufferedDocumentEventWithTarget = BufferedDocumentEvent & {target: 'draft' | 'published'}

function setTarget(target: 'draft' | 'published') {
  return (ev: BufferedDocumentEvent) => ({...ev, target})
}

export function documentPairEventsFor(idPair: IdPair): Observable<BufferedDocumentEventWithTarget> {
  return cachedPair(idPair).pipe(
    switchMap(({draft, published}) =>
      merge(
        draft.events.pipe(map(setTarget('draft'))),
        published.events.pipe(map(setTarget('published')))
      )
    )
  )
}
