import {type GlobalDocumentReferenceSchemaType, type SanityDocument} from '@sanity/types'
import {keyBy} from 'lodash'
import {combineLatest, EMPTY, type Observable, of, share} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'

import {
  type DocumentAvailability,
  type FieldName,
  getPreviewPaths,
  prepareForPreview,
} from '../../../../../preview'
import {createPathObserver} from '../../../../../preview/createPathObserver'
import {isRecord} from '../../../../../util'
import {type GlobalDocumentReferenceInfo} from '../../../../inputs/GlobalDocumentReferenceInput/types'
import {type ReferenceClient} from './getReferenceClient'

const REQUEST_TAG_BASE = 'gdr'

const AVAILABILITY_READABLE = {
  available: true,
  reason: 'READABLE',
} as const

const AVAILABILITY_PERMISSION_DENIED = {
  available: false,
  reason: 'PERMISSION_DENIED',
} as const

const AVAILABILITY_NOT_FOUND = {
  available: false,
  reason: 'NOT_FOUND',
} as const

/**
 * Takes a client instance and returns a function that can be called to retrieve reference information
 */
export function createGetReferenceInfo(context: {client: ReferenceClient}) {
  const {client} = context

  /**
   * Takes an id and a reference schema type, returns metadata about it
   * Assumption: _id is always published id
   */
  return function getReferenceInfo(
    doc: {_id: string; _type?: string}, // pass {_id, _type} instead and we can skip the `fetchType`
    referenceType: GlobalDocumentReferenceSchemaType,
  ): Observable<GlobalDocumentReferenceInfo> {
    return (
      doc._type
        ? of(doc)
        : client
            .getDocument<{_id: string; _type: string}>(doc._id)
            .pipe(map((res): {_id: string; _type?: string} => ({_id: doc._id, _type: res?._type})))
    ).pipe(
      switchMap((resolvedDoc) => {
        if (!resolvedDoc._type) {
          // we still can't read the type of the referenced document. This may be due to either 1) lack of access 2) lack of existence
          // we want to display a reason to the end user, so we're fetching metadata about it
          return fetchDocumentAvailability(client, doc._id).pipe(
            map((availability) => ({
              id: doc._id,
              type: undefined,
              availability,
              preview: {published: undefined},
            })),
          )
        }
        const refSchemaType = referenceType.to.find(
          (candidate) => candidate.type === resolvedDoc._type,
        )
        if (!refSchemaType) {
          return of({
            id: doc._id,
            type: resolvedDoc._type,
            availability: AVAILABILITY_READABLE,
            preview: {published: undefined},
          })
        }

        const previewPaths = getPreviewPaths(refSchemaType?.preview) || []
        const listener = client.listen('*', {}, {includeResult: true}).pipe(share())
        const observeFields = createObserveFields({client, listener})
        const observePaths = createPathObserver({observeFields})

        const publishedPreview$ = observePaths(doc, previewPaths).pipe(
          map((result) => (result ? prepareForPreview(result, refSchemaType) : result)),
        )

        return combineLatest([publishedPreview$]).pipe(
          map(([publishedPreview]) => {
            return {
              type: resolvedDoc._type,
              id: doc._id,
              availability: AVAILABILITY_READABLE,
              preview: {
                published: isRecord(publishedPreview) ? publishedPreview : undefined,
              },
            }
          }),
        )
      }),
    )
  }
}

function createObserveFields(context: {
  client: ReferenceClient
  listener: Observable<{type: 'welcome'} | {type: 'mutation'; data?: unknown}>
}): (id: string, fields: FieldName[]) => Observable<Record<string, unknown> | null> {
  const {client, listener} = context
  return function observeFields(id: string, fields: string[]) {
    return listener.pipe(
      switchMap((event) => {
        if (event.type === 'welcome') {
          return client.getDocument(id)
        }
        if (!event.data) {
          return EMPTY
        }

        const data = event.data as {result: SanityDocument; documentId: string; transition: string}

        if (data.documentId !== id) {
          return EMPTY
        }
        if (data.transition === 'disappear') {
          return of(null)
        }

        return of(data.result)
      }),
    )
  }
}

function fetchDocumentAvailability(
  client: ReferenceClient,
  id: string,
): Observable<DocumentAvailability | null> {
  const queryParams = new URLSearchParams({
    excludeContent: 'true',
    tag: `${REQUEST_TAG_BASE}.availability`,
  })

  return client.getDocuments([id], queryParams).pipe(
    map((response) => {
      const omitted = keyBy(response.omitted || [], (entry) => entry.id)
      const omittedEntry = omitted[id]
      if (!omittedEntry) {
        // it's not omitted, so it exists and is readable
        return AVAILABILITY_READABLE
      }
      // omitted because it doesn't exist
      if (omittedEntry.reason === 'existence') {
        return AVAILABILITY_NOT_FOUND
      }
      if (omittedEntry.reason === 'permission') {
        // omitted because it's not readable
        return AVAILABILITY_PERMISSION_DENIED
      }
      return null
    }),
  )
}
