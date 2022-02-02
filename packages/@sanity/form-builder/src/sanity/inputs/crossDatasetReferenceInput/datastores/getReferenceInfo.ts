import {map, share, startWith, switchMap} from 'rxjs/operators'

import {CrossDatasetReferenceSchemaType, PreviewConfig, ReferenceSchemaType} from '@sanity/types'
import {EMPTY, fromEvent, Observable, timer} from 'rxjs'
import {AvailabilityReason, DocumentAvailability, getIdPair} from '@sanity/base/_internal'

// eslint-disable-next-line camelcase
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

function callPrepare(value: any, previewConfig: PreviewConfig) {
  // todo: consider adding some more safeguards here
  if (!previewConfig?.prepare) {
    return value
  }
  try {
    return previewConfig.prepare(value)
  } catch (error) {
    error.message = `Got an error while calling preview.prepare with a cross dataset referenced document: ${error.message}`
    console.error(error)
    return value
  }
}

function fetchType(client: SanityClient, id: string) {
  return client.observable.fetch(`*[_id == $id][0]._type`, {id})
}

const POLL_INTERVAL = 5000
// We want to poll for changes in the other dataset, but only when window/tab is visible
// This sets up a shared stream that emits an event every `POLL_INTERVAL` milliseconds as long as the
// document is visible. It starts emitting immediately (if the page is visible)
const visiblePoll$ = fromEvent(document, 'visibilitychange').pipe(
  startWith(0),
  map(() => document.visibilityState === 'visible'),
  switchMap((visible) => (visible ? timer(0, POLL_INTERVAL) : EMPTY)),
  share()
)

/**
 * Takes an id and a reference schema type, returns metadata about it
 * @param id
 * @param referenceType
 */
export function getReferenceInfo(
  client: SanityClient,
  referenceType: CrossDatasetReferenceSchemaType,
  id: string
): Observable<CrossDatasetReferenceInfo> {
  const {publishedId} = getIdPair(id)

  return visiblePoll$.pipe(
    startWith(0),
    switchMap(() => fetchType(client, id)),
    switchMap((refDocumentType) => {
      if (!refDocumentType) {
        // we can't read the type of the referenced document. This may be due to either 1) lack of access 2) lack of existence
        // we want to display a reason to the end user, so we're fetching metadata about it
        return fetchDocumentAvailability(client, id).pipe(
          map((availability) => ({
            id,
            type: null,
            availability,
            preview: {published: undefined},
          }))
        )
      }
      const refType = referenceType.to.find((candidate) => candidate.type === refDocumentType)

      const selections = previewConfigToGroqSelection(refType?.preview)
      return client.observable
        .fetch(
          `*[_id == $id][0] {${selections}, _id, _type, _updatedAt}`,
          {id: publishedId},
          {tag: `${REQUEST_TAG_BASE}.preview`}
        )
        .pipe(
          map((result) => ({
            id: result._id as string,
            type: result._type as string,
            availability: AVAILABILITY_READABLE,
            preview: {
              // For now, cross dataset references will only get published documents
              // We keep it on a separate "published"-key to align with the format of the "regular" reference input
              // In the future we may want to add a `draft` key here as well
              published: result
                ? (callPrepare(result, refType.preview) as DocumentPreview)
                : undefined,
            },
          }))
        )
    })
  )
}

function previewConfigToGroqSelection(previewConfig: ReferenceSchemaType['preview']) {
  const selection = previewConfig?.select

  if (!selection) return ''

  return Object.keys(selection)
    .map((key) => `"${key}": ${selection[key]}`)
    .join(',')
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
