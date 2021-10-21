import {merge} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {memoizedPair} from './memoizedPair'

export const remoteSnapshots = memoize(
  (idPair: IdPair, typeName) => {
    return memoizedPair(idPair, typeName).pipe(
      switchMap(({published, draft}) => merge(published.remoteSnapshot$, draft.remoteSnapshot$))
    )
  },
  (idPair, typeName) => idPair.publishedId + typeName
)
