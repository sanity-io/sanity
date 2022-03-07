/* eslint-disable max-nested-callbacks */
import {map, switchMap} from 'rxjs/operators'

import {CrossDatasetReferenceSchemaType} from '@sanity/types'
import {combineLatest, Observable, of} from 'rxjs'
import {
  AvailabilityReason,
  DocumentAvailability,
  getPreviewPaths,
  observeDocumentTypeFromId,
  observePaths,
  prepareForPreview,
} from '@sanity/base/_internal'
import {SanityClient} from '@sanity/client'
import {keyBy} from 'lodash'
import {
  CrossDatasetReferenceInfo,
  DocumentPreview,
} from '../../../../inputs/CrossDatasetReferenceInput/types'

const REQUEST_TAG_BASE = 'cross-dataset-refs'

const AVAILABILITY_READABLE = {
  available: true,
  reason: AvailabilityReason.READABLE,
} as const

const AVAILABILITY_PERMISSION_DENIED = {
  available: false,
  reason: AvailabilityReason.PERMISSION_DENIED,
} as const

const AVAILABILITY_NOT_FOUND = {
  available: false,
  reason: AvailabilityReason.NOT_FOUND,
} as const

/**
 * Takes a client instance and returns a function that can be called to retrieve reference information
 * @param client
 */
export function createGetReferenceInfo(client: SanityClient) {
  const {dataset, projectId} = client.config()

  /**
   * Takes an id and a reference schema type, returns metadata about it
   * Assumption: _id is always published id
   * @param id
   * @param referenceType
   */
  return function getReferenceInfo(
    doc: {_id: string; _type?: string}, // pass {_id, _type} instead and we can skip the `fetchType`
    referenceType: CrossDatasetReferenceSchemaType
  ): Observable<CrossDatasetReferenceInfo> {
    return (doc._type
      ? of(doc)
      : observeDocumentTypeFromId(doc._id, {dataset, projectId}).pipe(
          map((docType): {_id: string; _type?: string} => ({_id: doc._id, _type: docType}))
        )
    ).pipe(
      switchMap((resolvedDoc) => {
        if (!resolvedDoc._type) {
          // we still can't read the type of the referenced document. This may be due to either 1) lack of access 2) lack of existence
          // we want to display a reason to the end user, so we're fetching metadata about it
          return fetchDocumentAvailability(client, doc._id).pipe(
            map((availability) => ({
              id: doc._id,
              type: null,
              availability,
              preview: {published: undefined},
            }))
          )
        }
        const refSchemaType = referenceType.to.find(
          (candidate) => candidate.type === resolvedDoc._type
        )
        const previewPaths = [
          ...(getPreviewPaths(refSchemaType.preview) || []),
          ['_updatedAt'],
          ['_createdAt'],
        ]

        const publishedPreview$ = observePaths(doc._id, previewPaths, {projectId, dataset}).pipe(
          map((result) => (result ? prepareForPreview(result, refSchemaType) : result))
        )
        return combineLatest([publishedPreview$]).pipe(
          map(([publishedPreview]) => {
            return {
              type: resolvedDoc._type,
              id: doc._id,
              availability: AVAILABILITY_READABLE,
              preview: {
                published: publishedPreview as DocumentPreview,
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
): Observable<DocumentAvailability> {
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
