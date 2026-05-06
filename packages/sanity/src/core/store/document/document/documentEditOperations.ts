import {type Observable, concat, map, of, merge, mergeMap, shareReplay, EMPTY} from 'rxjs'

import {memoize} from '../utils/createMemoizer'
import {type DocumentContext} from './document'
import {documentOperationArgs} from './documentOperationArgs'
import {documentOperationEvents} from './documentOperationEvents'
import {createDocumentOperationsAPI, GUARDED} from './operations/helpers'
import {type DocumentOperationsAPI} from './operations/types'
import {type DocumentTarget} from './types'
import {getDocumentMemoizeKey} from './utils'

export const documentEditOperations = memoize(
  (
    documentId: string,
    ctx: DocumentContext,
    target: DocumentTarget,
    typeName: string,
  ): Observable<DocumentOperationsAPI> => {
    const operationEvents$ = documentOperationEvents(ctx, documentId, target, typeName)

    const operationArgs$ = documentOperationArgs(ctx, documentId, target, typeName)
    const operations$ = operationArgs$.pipe(map(createDocumentOperationsAPI))

    // To makes sure we connect the stream that actually performs the operations
    return concat(
      of(GUARDED),
      merge(operationEvents$.pipe(mergeMap(() => EMPTY)), operations$),
    ).pipe(shareReplay({refCount: true, bufferSize: 1}))
  },
  (documentId, ctx) => getDocumentMemoizeKey(ctx.client, documentId),
)
