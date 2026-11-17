import {type SanityClient, type SanityDocument} from '@sanity/client'
import {type GlobalDocumentReferenceSchemaType} from '@sanity/types'
import keyBy from 'lodash-es/keyBy.js'
import {type Observable, of} from 'rxjs'
import {distinctUntilChanged, map, switchMap} from 'rxjs/operators'

import {
  type DocumentAvailability,
  type FieldName,
  type Previewable,
  type PreviewPath,
} from '../../../../../preview/types'
import {getPreviewPaths} from '../../../../../preview/utils/getPreviewPaths'
import {prepareForPreview} from '../../../../../preview/utils/prepareForPreview'
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
 * The shared, per-resource observers that reference info is resolved through
 */
interface ReferencedResourceObservers {
  client: SanityClient
  observeDocument: (id: string) => Observable<SanityDocument | null>
  observePaths: (
    value: Previewable,
    paths: (FieldName | PreviewPath)[],
  ) => Observable<Record<string, unknown> | null>
}

/**
 * Takes the observers of a referenced resource and returns a function that can be called to retrieve reference information
 */
export function createGetReferenceInfo(resource: ReferencedResourceObservers) {
  const {client, observeDocument, observePaths} = resource

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
        ? of(doc._type)
        : observeDocument(doc._id).pipe(
            map((document) => document?._type),
            distinctUntilChanged(),
          )
    ).pipe(
      switchMap((type): Observable<GlobalDocumentReferenceInfo> => {
        if (!type) {
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
        const refSchemaType = referenceType.to.find((candidate) => candidate.type === type)
        if (!refSchemaType) {
          return of({
            id: doc._id,
            type,
            availability: AVAILABILITY_READABLE,
            preview: {published: undefined},
          })
        }

        const previewPaths = getPreviewPaths(refSchemaType.preview) || []

        return observePaths(doc, previewPaths).pipe(
          map((result) => (result ? prepareForPreview(result, refSchemaType) : null)),
          map((publishedPreview) => ({
            type,
            id: doc._id,
            availability: AVAILABILITY_READABLE,
            preview: {
              published: isRecord(publishedPreview) ? publishedPreview : undefined,
            },
          })),
        )
      }),
    )
  }
}

function fetchDocumentAvailability(
  client: SanityClient,
  id: string,
): Observable<DocumentAvailability | null> {
  const requestOptions = {
    url: client.getDataUrl('doc', id),
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
