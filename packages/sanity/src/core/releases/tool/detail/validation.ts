import {type SanityDocument, type Schema} from '@sanity/types'
import {combineLatest, type Observable} from 'rxjs'
import {map, shareReplay} from 'rxjs/operators'
import {
  type DocumentPreviewStore,
  type LocaleSource,
  type SanityClient,
  type SourceClientOptions,
} from 'sanity'

import {validation} from '../../../store/_legacy/document/document-pair/validation'

export const documentsValidation = (
  ctx: {
    observeDocumentPairAvailability: DocumentPreviewStore['unstable_observeDocumentPairAvailability']
    observeDocument: (id: string) => Observable<SanityDocument | undefined>
    client: SanityClient
    getClient: (options: SourceClientOptions) => SanityClient
    schema: Schema
    i18n: LocaleSource
    serverActionsEnabled: Observable<boolean>
  },
  documentIds: string[] = [],
) => {
  return combineLatest(
    documentIds.map((id) => {
      const document$ = ctx.observeDocument(id)
      const idPair = {
        draftIds: [],
        publishedId: id,
      }
      // TODO: Update this function to get the type from the document$ observable
      return validation(ctx, idPair, '', document$).pipe(map((res) => ({documentId: id, ...res})))
    }),
  ).pipe(shareReplay({bufferSize: 1, refCount: true}))
}
