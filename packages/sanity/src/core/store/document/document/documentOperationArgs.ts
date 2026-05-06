import {combineLatest, map, switchMap, tap, type Observable} from 'rxjs'

import {memoize} from '../utils/createMemoizer'
import {type DocumentContext} from './document'
import {documentSnapshot} from './documentSnapshot'
import {getDocumentVersions} from './getDocumentVersions'
import {type DocumentOperationArgs} from './operations/types'
import {type DocumentTarget} from './types'
import {getDocumentMemoizeKey} from './utils'

export const documentOperationArgs = memoize(
  (
    ctx: DocumentContext,
    documentId: string,
    target: DocumentTarget,
    typeName: string,
  ): Observable<DocumentOperationArgs> => {
    return documentSnapshot(documentId, ctx).pipe(
      switchMap(({document}) => {
        const versions$ = getDocumentVersions(target, ctx.documentPreviewStore)
        return combineLatest([document.snapshots$, versions$]).pipe(
          map(([snapshot, versions]) => {
            return {
              client: ctx.client,
              schema: ctx.schema,
              typeName: typeName,
              documentId: documentId,
              snapshot: snapshot,
              target: target,
              document: document,
              historyStore: ctx.historyStore,
              publishedId: versions.publishedId,
              draftId: versions.draftId,
            }
          }),
          tap((args) => {
            // oxlint-disable-next-line no-console
            console.log('documentOperationArgs', args)
          }),
        )
      }),
    )
  },
  (ctx, documentId) => getDocumentMemoizeKey(ctx.client, documentId),
)
