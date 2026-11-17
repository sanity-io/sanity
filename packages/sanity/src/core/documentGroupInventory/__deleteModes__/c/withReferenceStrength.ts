/**
 * REVIEW BUILD ONLY. Option C's referrer classification (#15984), kept apart so the shared
 * `useReferringDocuments` keeps main's behaviour for the document menu and the other modes.
 */
import {type SanityClient} from '@sanity/client'
import {type Observable, of} from 'rxjs'
import {catchError, map, switchMap} from 'rxjs/operators'

import {getPublishedId, isVersionId} from '../../../util/draftUtils'
import {type ReferringDocuments} from './deletionMachine'

type Strength = {required: boolean; failsLater: boolean}

/**
 * Whether `value` holds a strong reference to `targetId` anywhere in its content. A reference is
 * strong unless it is marked `_weak`. The document's `_system` subtree is skipped: its identity
 * references (the group, the variant, the release) are not content and never block a delete.
 */
export function hasStrongReferenceTo(value: unknown, targetId: string): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasStrongReferenceTo(item, targetId))
  }
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  if (record._ref === targetId && record._weak !== true) {
    return true
  }
  return Object.entries(record).some(
    ([key, child]) => key !== '_system' && hasStrongReferenceTo(child, targetId),
  )
}

/**
 * Whether `document` is a copy that belongs to a release. `_system.release` says so on documents
 * that carry `_system`; older documents without it can only be release copies when their id is a
 * version id, since variant copies always carry `_system`.
 */
function isReleaseCopy(document: Record<string, unknown>): boolean {
  const system = document._system as {release?: {_ref?: unknown}} | null | undefined
  if (system && typeof system === 'object') {
    return Boolean(system.release?._ref)
  }
  return typeof document._id === 'string' && isVersionId(document._id)
}

/**
 * How a referring document links to `targetId`, as the Content Lake sees it when the target is
 * deleted: `required` (strong, the Lake refuses), `failsLater` (strong, only in a release copy: the
 * Lake allows it and the release fails when published), or neither (weak).
 */
export function classifyReferrer(document: Record<string, unknown>, targetId: string): Strength {
  const strong = hasStrongReferenceTo(document, targetId)
  if (!strong) return {required: false, failsLater: false}
  return isReleaseCopy(document)
    ? {required: false, failsLater: true}
    : {required: true, failsLater: false}
}

/**
 * Marks each internal reference of `referringDocuments$` as `required`, `failsLater` or neither, by
 * reading the referring documents once per change of the reference list. If that read fails, the
 * references are passed on unmarked, so the dialog falls back to main's warning.
 */
export function withReferenceStrength(
  referringDocuments$: Observable<ReferringDocuments>,
  documentId: string,
  client: SanityClient,
): Observable<ReferringDocuments> {
  const publishedId = getPublishedId(documentId)
  let lastKey: string | undefined
  let lastStrengths: Map<string, Strength> | undefined

  return referringDocuments$.pipe(
    switchMap((state) => {
      const internalReferences = state.internalReferences
      const ids = internalReferences?.references.map((reference) => reference._id) ?? []
      if (!internalReferences || ids.length === 0) return of(state)

      const apply = (strengths: Map<string, Strength>): ReferringDocuments => ({
        ...state,
        internalReferences: {
          ...internalReferences,
          references: internalReferences.references.map((reference) => ({
            ...reference,
            required: strengths.get(reference._id)?.required ?? false,
            failsLater: strengths.get(reference._id)?.failsLater ?? false,
          })),
        },
      })

      const key = ids.join(',')
      if (key === lastKey && lastStrengths) return of(apply(lastStrengths))

      return client.observable
        .fetch<Array<Record<string, unknown> & {_id: string}>>(
          '*[_id in $ids]',
          {ids},
          {perspective: 'raw', tag: 'use-referring-documents.strength'},
        )
        .pipe(
          map((documents) => {
            const strengths = new Map(
              documents.map((document) => [document._id, classifyReferrer(document, publishedId)]),
            )
            lastKey = key
            lastStrengths = strengths
            return apply(strengths)
          }),
          catchError(() => of(state)),
        )
    }),
  )
}
