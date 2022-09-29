import {SanityClient} from '@sanity/client'
import {merge} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {memoizedPair} from './memoizedPair'

/** @internal */
export const remoteSnapshots = memoize(
  (client: SanityClient, idPair: IdPair, typeName: string) => {
    return memoizedPair(client, idPair, typeName).pipe(
      switchMap(({published, draft}) => merge(published.remoteSnapshot$, draft.remoteSnapshot$))
    )
  },
  (_client, idPair, typeName) => idPair.publishedId + typeName
)
