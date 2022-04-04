import {map, mergeMap, switchMap} from 'rxjs/operators'
import {ReferenceFilterSearchOptions, ReferenceSchemaType} from '@sanity/types'
import {combineLatest, EMPTY, Observable, of} from 'rxjs'
import {SanityClient} from '@sanity/client'
import {
  AvailabilityReason,
  DocumentPreviewStore,
  getPreviewPaths,
  prepareForPreview,
} from '../../../../preview'
import {createWeightedSearch} from '../../../../search'
import {getIdPair, CollatedHit, getDraftId, collate} from '../../../../util'
import {DocumentPreview, ReferenceInfo} from '../../../inputs/ReferenceInput/types'

const READABLE = {
  available: true,
  reason: AvailabilityReason.READABLE,
} as const

const PERMISSION_DENIED = {
  available: false,
  reason: AvailabilityReason.PERMISSION_DENIED,
} as const

const NOT_FOUND = {
  available: false,
  reason: AvailabilityReason.NOT_FOUND,
} as const

/**
 * Takes an id and a reference schema type, returns metadata about it
 * @param id
 * @param referenceType
 */
export function getReferenceInfo(
  documentPreviewStore: DocumentPreviewStore,
  id: string,
  referenceType: ReferenceSchemaType
): Observable<ReferenceInfo> {
  const {publishedId, draftId} = getIdPair(id)

  return documentPreviewStore.unstable_observeDocumentPairAvailability(id).pipe(
    switchMap(({draft: draftAvailability, published: publishedAvailability}) => {
      if (!draftAvailability.available && !publishedAvailability.available) {
        // combine availability of draft + published
        const availability =
          draftAvailability.reason === 'PERMISSION_DENIED' ||
          publishedAvailability.reason === 'PERMISSION_DENIED'
            ? PERMISSION_DENIED
            : NOT_FOUND
        // short circuit, neither draft nor published is available so no point in trying to get preview
        return of({
          id,
          type: undefined,
          availability,
          preview: {
            draft: undefined,
            published: undefined,
          },
        } as const)
      }
      return combineLatest([
        documentPreviewStore.observeDocumentTypeFromId(draftId),
        documentPreviewStore.observeDocumentTypeFromId(publishedId),
      ]).pipe(
        switchMap(([draftTypeName, publishedTypeName]) => {
          // assume draft + published are always same type
          const typeName = draftTypeName || publishedTypeName

          if (!typeName) {
            // we have already asserted that either the draft or the published document is readable, so
            // if we get here we can't read the _type, so we're likely to be in an inconsistent state
            // waiting for an update to reach the client. Since we're in the context of a reactive stream based on
            // the _type we'll get it eventually
            return EMPTY
          }

          // get schema type for the referenced document
          const refSchemaType = referenceType.to.find((memberType) => memberType.name === typeName)!

          const previewPaths = [
            ...(getPreviewPaths(refSchemaType.preview) || []),
            ['_updatedAt'],
            ['_createdAt'],
          ]

          const draftPreview$ = documentPreviewStore
            .observePaths(draftId, previewPaths)
            .pipe(map((result) => (result ? prepareForPreview(result, refSchemaType) : result)))
          const publishedPreview$ = documentPreviewStore
            .observePaths(publishedId, previewPaths)
            .pipe(map((result) => (result ? prepareForPreview(result, refSchemaType) : result)))
          return combineLatest([draftPreview$, publishedPreview$]).pipe(
            map(([draftPreview, publishedPreview]): ReferenceInfo => {
              const availability =
                // eslint-disable-next-line no-nested-ternary
                draftAvailability.available || publishedAvailability.available
                  ? READABLE
                  : draftAvailability.reason === 'PERMISSION_DENIED' ||
                    publishedAvailability.reason === 'PERMISSION_DENIED'
                  ? PERMISSION_DENIED
                  : NOT_FOUND
              return {
                type: typeName,
                id: publishedId,
                availability,
                preview: {
                  draft: draftPreview as DocumentPreview,
                  published: publishedPreview as DocumentPreview,
                },
              }
            })
          )
        })
      )
    })
  )
}

interface SearchHit {
  id: string
  type: string
  draft?: {_id: string; _type: string}
  published?: {_id: string; _type: string}
}

/**
 * when we get a search result it may not include all [draft, published] id pairs for documents matching the
 * query. For example: searching for "potato" may yield a hit in the draft, but not the published (or vice versa)
 * This method takes a list of collated search hits and returns an array of the missing "counterpart" ids
 * @param collatedHits
 */
function getCounterpartIds(collatedHits: CollatedHit[]): string[] {
  return collatedHits
    .filter(
      (collatedHit) =>
        // we're interested in hits where either draft or published is missing
        !collatedHit.draft || !collatedHit.published
    )
    .map((collatedHit) =>
      // if we have the draft, return the published id or vice versa
      collatedHit.draft ? collatedHit.id : getDraftId(collatedHit.id)
    )
}

function getExistingCounterparts(client: SanityClient, ids: string[]) {
  return ids.length === 0
    ? of([])
    : client.observable.fetch(`*[_id in $ids]._id`, {ids}, {tag: 'get-counterpart-ids'})
}

export function search(
  client: SanityClient,
  textTerm: string,
  type: ReferenceSchemaType,
  options: ReferenceFilterSearchOptions
): Observable<SearchHit[]> {
  const searchWeighted = createWeightedSearch(type.to, client, options)
  return searchWeighted(textTerm, {includeDrafts: true}).pipe(
    map((results) => results.map((result) => result.hit)),
    map(collate),
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
        })
      )
    })
  )
}
