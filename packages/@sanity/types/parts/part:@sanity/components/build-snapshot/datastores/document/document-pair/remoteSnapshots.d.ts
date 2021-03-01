import {IdPair} from '../types'
export declare const remoteSnapshots: (
  arg1: IdPair
) => import('rxjs').Observable<
  | (import('../buffered-doc/types').SnapshotEvent & {
      version: 'published' | 'draft'
    })
  | (import('../buffered-doc/types').DocumentRemoteMutationEvent & {
      version: 'published' | 'draft'
    })
>
