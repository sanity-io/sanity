import {type PreviewValue, type SchemaType} from '@sanity/types'
import {combineLatest, type Observable, of} from 'rxjs'
import {catchError, map} from 'rxjs/operators'

import {type InventoryIndex} from '../types'

/**
 * The slice of the document preview store the titles read: the store batches and caches
 * observed documents, so asking for a few on-screen rows costs a single round trip.
 *
 * @internal
 */
export type ObserveFeedPreview = (
  value: {_id: string; _type: string},
  type: SchemaType,
) => Observable<{snapshot: Pick<PreviewValue, 'title'> | null | undefined}>

/**
 * One on-screen row whose title to load: the document, and the version its title is read from.
 *
 * @internal
 */
export interface FeedTitleRow {
  groupId: string
  _id: string
  _type: string
}

/**
 * The title rows for the documents on screen. A row reads its title from the first version in
 * the shared version order: Published when there is one, then Drafts, then the earliest release.
 * Documents whose versions have not loaded are left out.
 *
 * @internal
 */
export function getFeedTitleRows(index: InventoryIndex, visibleGroupIds: string[]): FeedTitleRow[] {
  return [...new Set(visibleGroupIds)].flatMap((groupId) => {
    const version = index.byGroup.get(groupId)?.find((stub) => stub.kind !== 'agent')
    return version ? [{groupId, _id: version._id, _type: version._type}] : []
  })
}

/**
 * Titles for the rows on screen only, keyed by group id. A row whose type has no schema, or whose
 * preview fails, maps to `undefined`. Pass the visible rows, never the whole feed: each row is
 * one preview subscription.
 *
 * @internal
 */
export function observeFeedTitles({
  rows,
  observeForPreview,
  getSchemaType,
}: {
  rows: FeedTitleRow[]
  observeForPreview: ObserveFeedPreview
  getSchemaType: (typeName: string) => SchemaType | undefined
}): Observable<Map<string, string | undefined>> {
  if (rows.length === 0) {
    return of(new Map())
  }

  return combineLatest(
    rows.map(({groupId, _id, _type}) => {
      const schemaType = getSchemaType(_type)
      if (!schemaType) {
        return of([groupId, undefined] as const)
      }

      return observeForPreview({_id, _type}, schemaType).pipe(
        map(({snapshot}) => [groupId, titleText(snapshot?.title)] as const),
        catchError(() => of([groupId, undefined] as const)),
      )
    }),
  ).pipe(map((entries) => new Map(entries)))
}

function titleText(title: unknown): string | undefined {
  return typeof title === 'string' ? title : undefined
}
