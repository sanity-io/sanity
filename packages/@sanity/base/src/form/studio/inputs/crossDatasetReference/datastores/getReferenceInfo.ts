import {map, switchMap} from 'rxjs/operators'
import {CrossDatasetReferenceSchemaType} from '@sanity/types'
import {combineLatest, Observable, of} from 'rxjs'
import {SanityClient} from '@sanity/client'
import {keyBy} from 'lodash'
import {
  DocumentPreviewStore,
  getPreviewPaths,
  prepareForPreview,
  DocumentAvailability,
  Previewable,
} from '../../../../../preview'
import {CrossDatasetReferenceInfo} from '../../../../inputs/CrossDatasetReferenceInput/types'
import {FIXME} from '../../../../types'
import {isRecord} from '../../../../../util'

const REQUEST_TAG_BASE = 'cross-dataset-refs'

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
export function createGetReferenceInfo(context: {
  client: SanityClient
  documentPreviewStore: DocumentPreviewStore
}) {
  const {client, documentPreviewStore} = context
  const {dataset, projectId} = client.config()
  const apiConfig = dataset && projectId ? {dataset, projectId} : undefined

  /**
   * Takes an id and a reference schema type, returns metadata about it
   * Assumption: _id is always published id
   */
  return function getReferenceInfo(
    doc: {_id: string; _type?: string}, // pass {_id, _type} instead and we can skip the `fetchType`
    referenceType: CrossDatasetReferenceSchemaType
  ): Observable<CrossDatasetReferenceInfo> {
    return (
      doc._type
        ? of(doc)
        : documentPreviewStore
            .observeDocumentTypeFromId(doc._id, apiConfig)
            .pipe(map((docType): {_id: string; _type?: string} => ({_id: doc._id, _type: docType})))
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
            }))
          )
        }
        const refSchemaType = referenceType.to.find(
          (candidate) => candidate.type === resolvedDoc._type
        )

        const previewPaths = [
          ...(getPreviewPaths(refSchemaType?.preview) || []),
          ['_updatedAt'],
          ['_createdAt'],
        ]

        const publishedPreview$ = documentPreviewStore
          .observePaths(doc as Previewable, previewPaths, apiConfig)
          .pipe(
            map((result) => (result ? prepareForPreview(result, refSchemaType as FIXME) : result))
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
          })
        )
      })
    )
  }
}

function fetchDocumentAvailability(
  client: SanityClient,
  id: string
): Observable<DocumentAvailability | null> {
  const requestOptions = {
    uri: client.getDataUrl('doc', id),
    json: true,
    query: {excludeContent: 'true'},
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
    })
  )
}
