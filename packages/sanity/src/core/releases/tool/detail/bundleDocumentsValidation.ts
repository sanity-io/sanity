import {isValidationErrorMarker, type SanityDocument, type Schema} from '@sanity/types'
import {omit} from 'lodash'
import {combineLatest, type Observable} from 'rxjs'
import {distinctUntilChanged, map, scan, shareReplay} from 'rxjs/operators'
import {
  type DraftsModelDocumentAvailability,
  type LocaleSource,
  type SanityClient,
  type SourceClientOptions,
} from 'sanity'
import shallowEquals from 'shallow-equals'

import {validateDocumentWithReferences, type ValidationStatus} from '../../../validation'

function shareLatestWithRefCount<T>() {
  return shareReplay<T>({bufferSize: 1, refCount: true})
}

export interface DocumentValidationStatus extends ValidationStatus {
  documentId: string
  hasError: boolean
}

/**
 * It takes a list of document IDs and returns an observable of validation status for each document, indicating if it has
 * an error and adds the documentId to the result.
 */
export const bundleDocumentsValidation = (
  ctx: {
    observeDocumentPairAvailability: (id: string) => Observable<DraftsModelDocumentAvailability>
    observeDocument: (id: string) => Observable<SanityDocument | undefined>
    getClient: (options: SourceClientOptions) => SanityClient
    schema: Schema
    i18n: LocaleSource
  },
  documentIds: string[] = [],
): Observable<Map<string, DocumentValidationStatus>> => {
  return combineLatest(
    documentIds.map((id) => {
      const document$ = ctx.observeDocument(id).pipe(
        distinctUntilChanged((prev, next) => {
          if (prev?._rev === next?._rev) {
            return true
          }
          // _rev and _updatedAt may change without other fields changing (due to a limitation in mutator)
          // so only pass on documents if _other_ attributes changes
          return shallowEquals(omit(prev, '_rev', '_updatedAt'), omit(next, '_rev', '_updatedAt'))
        }),
        shareLatestWithRefCount(),
      )

      return validateDocumentWithReferences(ctx, document$).pipe(
        map((validation) => ({
          ...validation,
          documentId: id,
          hasError: validation.validation.some((marker) => isValidationErrorMarker(marker)),
        })),
      )
    }),
  ).pipe(
    // Transform to a dictionary with the id and value
    scan((acc, next) => {
      const newMap = new Map(acc) // Create a new Map instance based on the current accumulator
      next.forEach((status) => {
        newMap.set(status.documentId, status)
      })
      return newMap
    }, new Map<string, DocumentValidationStatus>()),
    shareLatestWithRefCount(),
  )
}
