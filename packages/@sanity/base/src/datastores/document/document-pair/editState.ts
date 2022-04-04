import {SanityClient} from '@sanity/client'
import {SanityDocument, Schema} from '@sanity/types'
import {Observable} from 'rxjs'
import {map, publishReplay, refCount, startWith} from 'rxjs/operators'
import {HistoryStore} from '../../history'
import {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {operationArgs} from './operationArgs'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'

// TODO: should we rename this?
export interface EditStateFor {
  id: string
  type: string
  draft: SanityDocument | null
  published: SanityDocument | null
  liveEdit: boolean
  ready: boolean
}

export const editState = memoize(
  (
    ctx: {
      client: SanityClient
      historyStore: HistoryStore
      schema: Schema
    },
    idPair: IdPair,
    typeName: string
  ): Observable<EditStateFor> => {
    const liveEdit = isLiveEditEnabled(ctx.schema, typeName)
    return operationArgs(ctx, idPair, typeName).pipe(
      map(({snapshots}) => ({
        id: idPair.publishedId,
        type: typeName,
        draft: snapshots.draft,
        published: snapshots.published,
        liveEdit,
        ready: true,
      })),
      startWith({
        id: idPair.publishedId,
        type: typeName,
        draft: null,
        published: null,
        liveEdit,
        ready: false,
      }),
      publishReplay(1),
      refCount()
    )
  },
  (_ctx, idPair, typeName) => idPair.publishedId + typeName
)
