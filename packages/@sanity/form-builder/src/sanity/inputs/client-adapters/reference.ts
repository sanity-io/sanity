import {map, mergeMap, switchMap} from 'rxjs/operators'

import {ReferenceFilterSearchOptions, ReferenceSchemaType} from '@sanity/types'
import {combineLatest, EMPTY, Observable, of} from 'rxjs'
import {
  collate,
  CollatedHit,
  createWeightedSearch,
  getDraftId,
  getPreviewPaths,
  getIdPair,
  observePaths,
  prepareForPreview,
  observeDocumentTypeFromId,
  // eslint-disable-next-line camelcase
  unstable_observeDocumentPairAvailability,
} from '@sanity/base/_internal'

// eslint-disable-next-line camelcase
import {searchClient} from '../../versionedClient'
import {DocumentPreview, ReferenceInfo} from '../../../inputs/ReferenceInput/types'

/**
 * Takes an id and a reference schema type, returns metadata about it
 * @param id
 * @param referenceType
 */
export function getReferenceInfo(
  id: string,
  referenceType: ReferenceSchemaType
): Observable<ReferenceInfo> {
  const {publishedId, draftId} = getIdPair(id)

  return unstable_observeDocumentPairAvailability(id).pipe(
    switchMap(({draft: draftAvailability, published: publishedAvailability}) => {
      if (!draftAvailability.available && !publishedAvailability.available) {
        // short circuit, neither draft nor published is readable so no point in trying to get preview
        return of({
          id,
          type: undefined,
          draft: {
            availability: draftAvailability,
            preview: undefined,
          },
          published: {
            availability: publishedAvailability,
            preview: undefined,
          },
        })
      }
      return combineLatest([
        observeDocumentTypeFromId(draftId),
        observeDocumentTypeFromId(publishedId),
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
          const refSchemaType = referenceType.to.find((member) => member.type.name === typeName)

          const previewPaths = [...getPreviewPaths(refSchemaType), ['_updatedAt'], ['_createdAt']]

          const draftPreview$ = observePaths(draftId, previewPaths).pipe(
            map((result) => (result ? prepareForPreview(result, refSchemaType) : result))
          )
          const publishedPreview$ = observePaths(publishedId, previewPaths).pipe(
            map((result) => (result ? prepareForPreview(result, refSchemaType) : result))
          )
          return combineLatest([draftPreview$, publishedPreview$]).pipe(
            map(
              ([draftPreview, publishedPreview]): ReferenceInfo => {
                return {
                  type: typeName,
                  id: publishedId,
                  draft: {
                    availability: draftAvailability,
                    preview: draftPreview as DocumentPreview,
                  },
                  published: {
                    availability: publishedAvailability,
                    preview: publishedPreview as DocumentPreview,
                  },
                }
              }
            )
          )
        })
      )
    })
  )
}

interface SearchHit {
  id: string
  type: string
  draft: undefined | {_id: string; _type: string}
  published: undefined | {_id: string; _type: string}
}

/**
 * when we get a search result it may not include all [draft, published] id pairs for documents matching the
 * query. For example: the search may yield a hit in the draft, but not the published and vice versag
 * This method takes a list of collated search hits, returns the ids that's missing
 * @param collated
 */
function getMissingIds(collated: CollatedHit[]): string[] {
  return collated
    .filter((c) => !c.draft || !c.published)
    .flatMap((c) => {
      const draftId = getDraftId(c.id)

      return [!c.draft && draftId, !c.published && c.id].filter(Boolean)
    })
}

export function search(
  textTerm: string,
  type: ReferenceSchemaType,
  options: ReferenceFilterSearchOptions
): Observable<SearchHit[]> {
  const searchWeighted = createWeightedSearch(type.to, searchClient, options)
  return searchWeighted(textTerm, {includeDrafts: true}).pipe(
    map((results) => results.map((result) => result.hit)),
    map(collate),
    map((collated) => collated.slice(0, 50)),
    mergeMap((collated) => {
      const ids = getMissingIds(collated)
      // note: this is a lot faster than doing the query *[_id in $ids] {_id}
      const q = `{${ids.map((id) => `"${id}": defined(*[_id == "${id}"][0]._id)`).join(',')}}`
      return searchClient.observable.fetch(q, {}, {tag: 'debug'}).pipe(
        map((result) =>
          collated.map((entry) => {
            const draftId = getDraftId(entry.id)
            return {
              id: entry.id,
              type: entry.type,
              draft: entry.draft || result[draftId] ? {_id: draftId, _type: entry.type} : undefined,
              published:
                entry.published || result[entry.id]
                  ? {_id: entry.id, _type: entry.type}
                  : undefined,
            }
          })
        )
      )
    })
  )
}
