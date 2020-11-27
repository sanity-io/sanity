import {IdPair} from '../types'
export declare function documentEvents(
  idPair: IdPair
): import('rxjs').Observable<
  | (import('../buffered-doc/types').DocumentRebaseEvent & {
      version: 'published' | 'draft'
    })
  | (import('../buffered-doc/types').DocumentMutationEvent & {
      version: 'published' | 'draft'
    })
  | (import('../buffered-doc/types').SnapshotEvent & {
      version: 'published' | 'draft'
    })
  | (import('../buffered-doc/types').CommittedEvent & {
      version: 'published' | 'draft'
    })
  | (import('../types').ReconnectEvent & {
      version: 'published' | 'draft'
    })
>
