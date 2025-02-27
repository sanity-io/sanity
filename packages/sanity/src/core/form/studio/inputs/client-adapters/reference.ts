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
  {version, perspective}: {version?: string; perspective?: StackablePerspective[]} = {},
): Observable<ReferenceInfo> {
  const {publishedId, draftId, versionId} = getIdPair(id, {version})

  const pairAvailability$ = documentPreviewStore.unstable_observeDocumentPairAvailability(id, {
    version,
  })

  return pairAvailability$.pipe(
    switchMap((pairAvailability) => {
      if (
        !pairAvailability.draft.available &&
        !pairAvailability.published.available &&
        !pairAvailability.version?.available
      ) {
        // combine availability of draft + published
        const availability =
          pairAvailability.version?.reason === 'PERMISSION_DENIED' ||
          pairAvailability.draft.reason === 'PERMISSION_DENIED' ||
          pairAvailability.published.reason === 'PERMISSION_DENIED'
            ? PERMISSION_DENIED
            : NOT_FOUND

        // short circuit, neither draft nor published nor version is available so no point in trying to get preview
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

      const typeName$ = combineLatest([
        documentPreviewStore.observeDocumentTypeFromId(draftId),
        documentPreviewStore.observeDocumentTypeFromId(publishedId),
        ...(versionId ? [documentPreviewStore.observeDocumentTypeFromId(versionId)] : []),
      ]).pipe(
        // assume draft + published + version are always same type
        map(
          ([draftTypeName, publishedTypeName, versionTypeName]) =>
            versionTypeName || draftTypeName || publishedTypeName,
        ),
      )

      return typeName$.pipe(
        switchMap((typeName) => {
          if (!typeName) {
            // we have already asserted that either the draft or the published document is readable, so
            // if we get here we can't read the _type, so we're likely to be in an inconsistent state
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
              const availability =
                // eslint-disable-next-line no-nested-ternary
                pairAvailability.version?.available ||
                pairAvailability.draft.available ||
                pairAvailability.published.available
                  ? READABLE
                  : pairAvailability.version?.reason === 'PERMISSION_DENIED' ||
                      pairAvailability.draft.reason === 'PERMISSION_DENIED' ||
                      pairAvailability.published.reason === 'PERMISSION_DENIED'
                    ? PERMISSION_DENIED
                    : NOT_FOUND
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

/**
 * when we get a search result it may not include all [draft, published] id pairs for documents matching the
 * query. For example: searching for "potato" may yield a hit in the draft, but not the published (or vice versa)
 *
 * This method takes a list of collated search hits and returns an array of the missing "counterpart" ids
 */
function getCounterpartIds(collatedHits: CollatedHit[]): string[] {
  return collatedHits
    .filter(
      (collatedHit) =>
        // we're interested in hits where either draft or published is missing
        !collatedHit.draft || !collatedHit.published,
    )
    .map((collatedHit) =>
      // if we have the draft, return the published id or vice versa
      collatedHit.draft ? collatedHit.id : getDraftId(collatedHit.id),
    )
}

function getExistingCounterparts(client: SanityClient, ids: string[]) {
  return ids.length === 0
    ? of([])
    : client.observable.fetch(`*[_id in $ids]._id`, {ids}, {tag: 'get-counterpart-ids'})
}

export function referenceSearch(
  client: SanityClient,
  textTerm: string,
  type: ReferenceSchemaType,
  options: ReferenceFilterSearchOptions,
): Observable<ReferenceSearchHit[]> {
  const search = createSearch(type.to, client, {
    ...options,
    maxDepth: options.maxFieldDepth || DEFAULT_MAX_FIELD_DEPTH,
  })
  return search(textTerm, {includeDrafts: true}).pipe(
    map(({hits}) => hits.map(({hit}) => hit)),
    map((docs) =>
      docs.map((doc) => ({
        ...doc,
        // Pass the original id if available, it could be a `draftId` or a `versionId` , the _id will be the published one when using perspectives to query the data.
        _id: (doc._originalId as string) || doc._id,
      })),
    ),
    map((docs) => collate(docs)),
    // pick the 100 best matches
    map((collated) => collated.slice(0, 100)),
    mergeMap((collated) => {
      // Note: It might seem like this step is redundant, but it's here for a reason:
      // The list of search hits returned from here will be passed as options to the reference input's autocomplete. When
      // one of them gets selected by the user, it will then be passed as the argument to the `onChange` handler in the
      // Reference Input. This handler will then look at the passed value to determine whether to make a link to a
      // draft (using _strengthenOnPublish) or a published document.
      //
      // Without this step, in a case where both a draft and a published version exist but only the draft matches
      // the search term, we'd end up making a reference with `_strengthenOnPublish: true`, when we instead should be
      // making a normal reference to the published id
      return getExistingCounterparts(client, getCounterpartIds(collated)).pipe(
        map((existingCounterpartIds) => {
          return collated.map((entry) => {
            const draftId = getDraftId(entry.id)
            return {
              id: entry.id,
              type: entry.type,
              draft:
                entry.draft || existingCounterpartIds.includes(draftId)
                  ? {_id: draftId, _type: entry.type}
                  : undefined,
              published:
                entry.published || existingCounterpartIds.includes(entry.id)
                  ? {_id: entry.id, _type: entry.type}
                  : undefined,
            }
          })
        }),
      )
    }),
  )
}
