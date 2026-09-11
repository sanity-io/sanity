import {
  type PreviewValue,
  type SanityDocument,
  type SchemaType,
  type SortOrdering,
} from '@sanity/types'
import {dequal} from 'dequal'
import {isValidElement, useEffect, useMemo, useState} from 'react'
import {useSyncObservable} from 'react-rx'
import {BehaviorSubject, concat, type Observable, of} from 'rxjs'
import {catchError, distinctUntilChanged, map, scan, switchMap} from 'rxjs/operators'

import {type PerspectiveStack} from '../perspective/types'
import {usePerspective} from '../perspective/usePerspective'
import {isGoingToUnpublish} from '../releases/util/isGoingToUnpublish'
import {useDocumentPreviewStore} from '../store/datastores'
import {getPublishedId} from '../util/draftUtils'
import {useShallowUnique} from '../util/useShallowUnique'
import {type Previewable} from './types'

/**
 * @internal
 * @deprecated use useValuePreview instead
 */
export const unstable_useValuePreview = useValuePreview

interface State {
  isLoading: boolean
  error?: Error
  value?: PreviewValue
}
const INITIAL_STATE: State = {
  isLoading: true,
}

const IDLE_STATE: State = {
  isLoading: false,
  value: {
    title: undefined,
    description: undefined,
  },
}

function isSameError(a: Error | undefined, b: Error | undefined): boolean {
  return a === b || (!!a && !!b && a.name === b.name && a.message === b.message)
}

// Every local mutation bumps the timestamps `prepareForPreview` preserves, and nothing renders them.
const IGNORED_PREVIEW_KEYS = new Set(['_createdAt', '_updatedAt'])

// Components and elements compare by identity (walking an element's props could reach fibers);
// plain media values such as image assets compare by content.
function isSameMedia(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a === 'function' || typeof b === 'function') return false
  if (isValidElement(a) || isValidElement(b)) return false
  return dequal(a, b)
}

function isSamePreview(a: PreviewValue | undefined, b: PreviewValue | undefined): boolean {
  if (a === b) return true
  if (!a || !b) return false
  const recordA = a as Record<string, unknown>
  const recordB = b as Record<string, unknown>
  for (const key of new Set([...Object.keys(recordA), ...Object.keys(recordB)])) {
    if (IGNORED_PREVIEW_KEYS.has(key)) continue
    const same =
      key === 'media' ? isSameMedia(recordA[key], recordB[key]) : dequal(recordA[key], recordB[key])
    if (!same) return false
  }
  return true
}

// Prepared previews are small, so comparing them is cheap. Editing a field the preview does not
// select, or passing an equal value object built during render, then leaves the rendered state
// alone instead of re-rendering every preview consumer (or, for the latter, looping).
function isSameState(a: State, b: State): boolean {
  return (
    a.isLoading === b.isLoading && isSameError(a.error, b.error) && isSamePreview(a.value, b.value)
  )
}

/**
 * Identifies what a value previews: a document or reference by id (per dataset for cross-dataset
 * references), an array item by key. A change of target resets the preview to loading; edits to
 * the same target keep the current preview until the next one arrives. Values without any of
 * these identifiers (plain objects previewed in place) all count as one target.
 */
function getPreviewTargetKey(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const {_id, _ref, _key, _projectId, _dataset} = value as {
    _id?: string
    _ref?: string
    _key?: string
    _projectId?: string
    _dataset?: string
  }
  const id = _id ?? _ref ?? _key
  if (id === undefined) return undefined
  return _dataset ? `${_projectId}/${_dataset}/${id}` : id
}
/**
 * @internal
 */
export function useValuePreview(props: {
  enabled?: boolean
  ordering?: SortOrdering
  schemaType?: SchemaType
  value: unknown | undefined
  perspectiveStack?: PerspectiveStack
  /**
   * The variant to preview the value as seen through, as a bare variant id.
   *
   * The variant travels with the perspective: when no `perspectiveStack` is given, both default to
   * the current selection in the perspective context. When a `perspectiveStack` is given, the
   * caller is previewing a specific document version and only the variant it passes here is used.
   */
  variant?: string
}): State {
  const {
    enabled = true,
    ordering,
    schemaType,
    value: previewValue,
    perspectiveStack: chosenPerspectiveStackProp,
    variant: chosenVariant,
  } = props || {}
  const {observeForPreview} = useDocumentPreviewStore()
  const {perspectiveStack, selectedVariantName} = usePerspective()
  // Callers build this inline (`useDocumentTitle` passes `[]`); keyed by contents so a fresh array
  // per render does not rebuild the observable.
  const chosenPerspectiveStack = useShallowUnique(chosenPerspectiveStackProp)

  // The value is a new object on every edit. It enters the pipeline through a subject so the
  // observable identity — and with it the subscription and the field observers it holds — survives
  // keystrokes; a new identity per value would resubscribe and refetch every reference it follows.
  const [value$] = useState(() => new BehaviorSubject<unknown>(previewValue))
  useEffect(() => {
    value$.next(previewValue)
  }, [previewValue, value$])

  const observable = useMemo<Observable<State>>(
    () =>
      value$.pipe(
        distinctUntilChanged(),
        scan<unknown, {value: unknown; key: string | undefined; targetChanged: boolean}>(
          (previous, value) => {
            const key = getPreviewTargetKey(value)
            return {value, key, targetChanged: key !== previous.key}
          },
          {value: undefined, key: undefined, targetChanged: false},
        ),
        switchMap(({value, targetChanged}) => {
          // this will render previews as "loaded" (i.e. not in loading state) – typically with "Untitled" text
          if (!enabled || !value || !schemaType) return of(IDLE_STATE)

          const goingToUnpublish = isGoingToUnpublish(value as SanityDocument)

          const updatedStack = goingToUnpublish ? [] : (chosenPerspectiveStack ?? perspectiveStack)
          // A document slated for unpublishing is previewed as its published version, which is
          // outside of any variant. Otherwise the variant follows the perspective: only inherited
          // from the context when the perspective is too.
          const updatedVariant = goingToUnpublish
            ? undefined
            : (chosenVariant ?? (chosenPerspectiveStack ? undefined : selectedVariantName))
          const updatedDocId = goingToUnpublish
            ? getPublishedId((value as SanityDocument)._id)
            : (value as SanityDocument)._id

          // allow for previewing the published document when a version is slated for unpublishing
          // but if it's not for unpublishing, then we want to preview the content as was before
          const restPreviewValue = goingToUnpublish ? {} : {...(value as Previewable)}

          const preview$ = observeForPreview(
            {
              _id: updatedDocId,
              ...restPreviewValue,
            },
            schemaType,
            {
              perspective: updatedStack,
              variant: updatedVariant,
              viewOptions: {ordering: ordering},
            },
          ).pipe(
            map((event) => ({isLoading: false, value: event.snapshot || undefined})),
            catchError((error) => of({isLoading: false, error})),
          )

          // A different document must not keep showing the previous one's preview while it loads.
          return targetChanged ? concat(of(INITIAL_STATE), preview$) : preview$
        }),
        distinctUntilChanged(isSameState),
      ),
    [
      value$,
      enabled,
      schemaType,
      chosenPerspectiveStack,
      perspectiveStack,
      chosenVariant,
      selectedVariantName,
      observeForPreview,
      ordering,
    ],
  )

  // Do not defer: search/reference UIs assert on preview titles synchronously after selection.
  return useSyncObservable(observable, INITIAL_STATE)
}
