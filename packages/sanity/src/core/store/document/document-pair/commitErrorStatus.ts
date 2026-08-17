import {type SanityClient} from '@sanity/client'
import {type Observable} from 'rxjs'
import {distinctUntilChanged, shareReplay, switchMap} from 'rxjs/operators'

import {type DocumentStoreExtraOptions} from '../getPairListener'
import {type IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {type CommitError} from './checkoutPair'
import {memoizedPair} from './memoizedPair'
import {memoizeKeyGen} from './memoizeKeyGen'

// The error from the most recent commit attempt for the document pair while
// it failed and is being retried by the mutator, or `undefined` while
// commits are healthy. Combined with consistency and connection state to
// distinguish "commits are failing" from "the backlog is merely slow" — see
// `useDocumentSyncState`.
export const commitErrorStatus: (
  client: SanityClient,
  idPair: IdPair,
  typeName: string,
  extraOptions?: DocumentStoreExtraOptions,
) => Observable<CommitError | undefined> = memoize(
  (
    client: SanityClient,
    idPair: IdPair,
    typeName: string,
    extraOptions?: DocumentStoreExtraOptions,
  ) => {
    return memoizedPair(client, idPair, typeName, extraOptions).pipe(
      switchMap((pair) => pair.commitError$),
      distinctUntilChanged(),
      shareReplay({bufferSize: 1, refCount: true}),
    )
  },
  memoizeKeyGen,
)
