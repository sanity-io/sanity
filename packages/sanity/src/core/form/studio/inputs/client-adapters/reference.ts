import {type SanityClient} from '@sanity/client'
import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {type ReferenceFilterSearchOptions, type ReferenceSchemaType} from '@sanity/types'
import {omit} from 'lodash'
import {combineLatest, from, type Observable, of} from 'rxjs'
import {map, mergeMap, scan, startWith, switchMap} from 'rxjs/operators'

import {type DocumentPreviewStore, getPreviewPaths, prepareForPreview} from '../../../../preview'
import {
  type VersionsRecord,
  type VersionTuple,
} from '../../../../preview/utils/getPreviewStateObservable'
import {type ReleaseId} from '../../../../releases'
import {createSearch} from '../../../../search'
import {
  collate,
  type CollatedHit,
  getDraftId,
  getIdPair,
  getVersionId,
  isRecord,
} from '../../../../util'
import {
  type PreviewDocumentValue,
  type ReferenceInfo,
  type ReferenceSearchHit,
} from '../../../inputs/ReferenceInput/types'

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
  {version}: {version?: string} = {},
  perspective: {releaseIds: ReleaseId[]; bundleStack: string[]} = {releaseIds: [], bundleStack: []},
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
        !pairAvailability.published.available
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
          preview: {
            draft: undefined,
            published: undefined,
            version: undefined,
            versions: {},
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
              preview: {
                draft: undefined,
                published: undefined,
                version: undefined,
                versions: {},
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
              preview: {
                draft: undefined,
                published: undefined,
                version: undefined,
                versions: {},
              },
            } as const)
          }
          const previewPaths = getPreviewPaths(refSchemaType?.preview) || []
          const draftPreview$ = documentPreviewStore.observeForPreview(
            {_id: draftId},
            refSchemaType,
          )

          const publishedPreview$ = documentPreviewStore.observeForPreview(
            {_id: publishedId},
            refSchemaType,
          )

          const versions$ = from(perspective.releaseIds).pipe(
            mergeMap((bundleId) =>
              documentPreviewStore
                .observePaths({_id: getVersionId(id, bundleId)}, previewPaths)
                .pipe(
                  map(
                    // eslint-disable-next-line max-nested-callbacks
                    (result): VersionTuple =>
                      result
                        ? [
                            bundleId,
                            {
                              snapshot: {
                                _id: versionId,
                                ...prepareForPreview(result, refSchemaType),
                              },
                            },
                          ]
                        : [bundleId, {snapshot: undefined}],
                  ),
                ),
            ),

            scan((byBundleId: VersionsRecord, [bundleId, value]) => {
              if (value.snapshot === null) {
                return omit({...byBundleId}, [bundleId])
              }

              return {
                ...byBundleId,
                [bundleId]: value,
              }
            }, {}),
            startWith<VersionsRecord>({}),
          )

          // Iterate the release stack in descending precedence, returning the highest precedence existing
          // version document.
          const versionPreview$ = versionId
            ? versions$.pipe(
                map((versions) => {
                  for (const bundleId of perspective.bundleStack) {
                    if (bundleId in versions) {
                      return versions[bundleId]
                    }
                  }
                  return null
                }),
                startWith(undefined),
              )
            : undefined

          const value$ = combineLatest([
            draftPreview$,
            publishedPreview$,
            ...(versionPreview$ ? [versionPreview$] : []),
            versions$,
          ]).pipe(
            map(([draft, published, versionValue, versions]) => ({
              draft,
              published,
              ...(versionValue ? {version: versionValue} : {}),
              versions: versions,
            })),
          )

          return value$.pipe(
            map((value): ReferenceInfo => {
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
                preview: {
                  draft: (isRecord(value.draft.snapshot) ? value.draft : undefined) as
                    | PreviewDocumentValue
                    | undefined,
                  published: (isRecord(value.published.snapshot) ? value.published : undefined) as
                    | PreviewDocumentValue
                    | undefined,
                  version: (isRecord(value.version?.snapshot)
                    ? value.version.snapshot
                    : undefined) as PreviewDocumentValue | undefined,

                  versions: isRecord(value.versions) ? value.versions : {},
                },
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
