import {type ListenEvent, type SanityClient, type SanityDocument} from '@sanity/client'
import {type GlobalDocumentReferenceSchemaType} from '@sanity/types'
import {keyBy} from 'lodash'
import {combineLatest, EMPTY, type Observable, of} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'

import type {DocumentAvailability} from '../../../../../preview/types'
import {getPreviewPaths} from '../../../../../preview/utils/getPreviewPaths'
import {prepareForPreview} from '../../../../../preview/utils/prepareForPreview'
import {createPathObserver} from '../../../../../preview/createPathObserver'
import {isRecord} from '../../../../../util/isRecord'
import {type GlobalDocumentReferenceInfo} from '../../../../inputs/GlobalDocumentReferenceInput/types'

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
export function createGetReferenceInfo(context: {client: SanityClient}) {
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
        : client.observable
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
        const listener = client.observable.listen(
          '*',
          {},
          {
            includeResult: true,
            tag: `${REQUEST_TAG_BASE}.preview`,
            // by default listen only emits the "mutation" event, however we use the initial "welcome" event to trigger the initial state
            events: ['mutation', 'welcome'],
          },
        )
        const observeFields = createObserveFields({client, listener})
        const observePaths = createPathObserver({observeFields})

        const publishedPreview$ = observePaths(doc, previewPaths).pipe(
          map((result) => {
            if (!result) {
              return null
            }
            return prepareForPreview(result, refSchemaType)
          }),
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
  client: SanityClient
  listener: Observable<ListenEvent<Record<string, any>>>
}) {
  const {client, listener} = context
  return function observeFields(
    id: string,
    fields: string[],
  ): Observable<SanityDocument<Record<string, any>> | null> {
    return listener.pipe(
      switchMap((event) => {
        if (event.type === 'welcome') {
          return client.observable
            .getDocument(id, {
              tag: `${REQUEST_TAG_BASE}.get-document`,
            })
            .pipe(
              map((doc) => {
                if (!doc) {
                  return null
                }
                return doc
              }),
            )
        }
        if (event.type !== 'mutation') {
          return EMPTY
        }
        const result = event.result
        if (!result) {
          return EMPTY
        }

        if (result.documentId !== id) {
          return EMPTY
        }
        if (result.transition === 'disappear') {
          return of(null)
        }

        return of(result)
      }),
    )
  }
}

function fetchDocumentAvailability(
  client: SanityClient,
  id: string,
): Observable<DocumentAvailability | null> {
  const requestOptions = {
    uri: client.getDataUrl('doc', id),
    json: true,
    excludeContent: 'true',
    tag: `${REQUEST_TAG_BASE}.availability`,
  }

  return client.observable.request(requestOptions).pipe(
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
