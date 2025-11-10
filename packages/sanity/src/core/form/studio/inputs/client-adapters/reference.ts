import {type SanityClient, type StackablePerspective} from '@sanity/client'
import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {type ReferenceFilterSearchOptions, type ReferenceSchemaType} from '@sanity/types'
import {combineLatest, type Observable, of} from 'rxjs'
import {map, mergeMap, switchMap} from 'rxjs/operators'

import {type DocumentPreviewStore, getPreviewStateObservable} from '../../../../preview'
import {createSearch} from '../../../../search'
import {collate, type CollatedHit, getDraftId, getIdPair} from '../../../../util'
import {type ReferenceInfo, type ReferenceSearchHit} from '../../../inputs/ReferenceInput/types'

const READABLE = {
  available: true,
  reason: 'READABLE',
} as const

const PERMISSION_DENIED = {
  available: false,
  reason: 'PERMISSION_DENIED',
} as const

const NOT_FOUND = {
  available: false,
  reason: 'NOT_FOUND',
} as const

/**
 * Takes an id and a reference schema type, returns metadata about it
 */
export function getReferenceInfo(
  documentPreviewStore: DocumentPreviewStore,
  id: string,
  referenceType: ReferenceSchemaType,
  perspective?: StackablePerspective[],
): Observable<ReferenceInfo> {
  const {publishedId, draftId} = getIdPair(id)

  const documentStackAvailability$ = documentPreviewStore.unstable_observeDocumentStackAvailability(
    id,
    perspective ?? ['published'],
  )

  return documentStackAvailability$.pipe(
    switchMap((stackAvailability) => {
      // we only care about the first document in the stack that exists
      const firstMatch = stackAvailability.find((doc) => {
        return doc.availability.available || doc.availability.reason === 'PERMISSION_DENIED'
      })

      if (!firstMatch?.availability.available) {
        const availability =
          firstMatch?.availability?.reason === 'PERMISSION_DENIED' ? PERMISSION_DENIED : NOT_FOUND

        // short circuit, no version is available so no point in trying to get preview
        return of({
          id,
          type: undefined,
          availability,
          isPublished: null,
          preview: {
            snapshot: null,
            original: null,
          },
        } as const)
      }

      const typeName$ = documentPreviewStore.observeDocumentTypeFromId(
        draftId,
        undefined,
        perspective,
      )

      return typeName$.pipe(
        switchMap((typeName) => {
          if (!typeName) {
            // We have already asserted that there exists a readable version of the document.
            // So if we get here, it means we can't read the _type, which again indicates we're in an inconsistent state and
            // waiting for an update to reach the client. Since we're in the context of a reactive stream based on
            // the _type we'll get it eventually
            return of({
              id,
              type: undefined,
              availability: {available: true, reason: 'READABLE'},
              isPublished: null,
              preview: {
                snapshot: null,
                original: null,
              },
            } as const)
          }

          // get schema type for the referenced document
          const refSchemaType = referenceType.to.find((memberType) => memberType.name === typeName)!

          if (!refSchemaType) {
            return of({
              id,
              type: typeName,
              availability: {available: true, reason: 'READABLE'},
              isPublished: null,
              preview: {
                snapshot: null,
                original: null,
              },
            } as const)
          }

          const publishedDocumentExists$ = documentPreviewStore
            .observePaths({_id: publishedId}, ['_rev'])
            .pipe(map((res) => Boolean((res as {_id: string; _rev: string} | undefined)?._rev)))

          const previewState$ = getPreviewStateObservable(
            documentPreviewStore,
            refSchemaType,
            publishedId,
            perspective,
          )

          return combineLatest([previewState$, publishedDocumentExists$]).pipe(
            map(([previewState, publishedDocumentExists]): ReferenceInfo => {
              const availability = READABLE
              return {
                type: typeName,
                id: publishedId,
                availability,
                isPublished: publishedDocumentExists,
                preview: {snapshot: previewState.snapshot, original: previewState.original},
              }
            }),
          )
        }),
      )
    }),
  )
}
