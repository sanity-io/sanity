import {
  type PreviewValue,
  type SanityDocument,
  type SchemaType,
  type SortOrdering,
} from '@sanity/types'
import {dequal} from 'dequal'
import isPlainObject from 'lodash-es/isPlainObject.js'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useSyncObservable} from 'react-rx'
import {BehaviorSubject, concat, type Observable, of} from 'rxjs'
import {catchError, distinctUntilChanged, map, scan, switchMap} from 'rxjs/operators'

import {type PerspectiveStack} from '../perspective/types'
import {usePerspective} from '../perspective/usePerspective'
import {isGoingToUnpublish} from '../releases/util/isGoingToUnpublish'
import {useDocumentPreviewStore} from '../store/datastores'
import {getPublishedId} from '../util/draftUtils'
import {shallowEquals} from '../util/shallowEquals'
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

// React elements and portals are plain objects too, recognisable by `$$typeof`.
function isReactNodeObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && '$$typeof' in value
}

// Plain media values such as image assets compare by content. Anything else — components,
// elements, arrays of elements, portals — compares by identity: walking React internals (an
// element's props or `_owner`) is not safe, and `prepare()` may build a fresh one per emission,
// in which case the preview simply re-renders as it did before.
function isSameMedia(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (!isPlainObject(a) || !isPlainObject(b)) return false
  if (isReactNodeObject(a) || isReactNodeObject(b)) return false
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

// Prepared previews are small, so comparing them is cheap: editing a field the preview does not
// select leaves the rendered state alone instead of re-rendering every preview consumer.
function isSameState(a: State, b: State): boolean {
  return (
    a.isLoading === b.isLoading && isSameError(a.error, b.error) && isSamePreview(a.value, b.value)
  )
}

interface PreviewTarget {
  previewable: Previewable
  perspective: PerspectiveStack
  variant: string | undefined
  /**
   * What the preview shows, independent of the input's shape. A change resets the preview to
   * loading; edits to the same target keep the current preview until the next one arrives.
   */
  key: string
}

/**
 * A state together with the key of the target it was computed for; `null` when there was nothing
 * to preview (disabled, no value, no schema type), which never matches a target.
 */
interface Emission {
  key: string | null
  state: State
}

const INITIAL_EMISSION: Emission = {key: null, state: INITIAL_STATE}

// Plain objects previewed in place carry no identifier; they all share this document segment.
const INLINE_TARGET_KEY = 'inline'

/**
 * Keys a target by the document it previews and the perspective it is seen through: a document
 * or reference by its published id — so `drafts.x`, `versions.*.x` and `x` are one document and
 * materializing a draft does not reset the preview — per project and dataset for cross-dataset
 * references, an array item by its `_key` as it is (an item key is not a document id). Values
 * without any identifier (plain objects previewed in place) all count as one target. The
 * perspective is part of the key, and so is previewing the published document in place of a
 * version slated for unpublishing: that switch must reset even when the perspective stack is
 * already empty.
 */
function getPreviewTargetKey(
  previewable: Previewable,
  perspective: PerspectiveStack,
  variant: string | undefined,
  publishedOnly: boolean,
): string {
  const {_id, _ref, _key, _projectId, _dataset} = previewable as {
    _id?: string
    _ref?: string
    _key?: string
    _projectId?: string
    _dataset?: string
  }
  const documentId = _id ?? _ref
  const document =
    documentId === undefined
      ? _key === undefined
        ? INLINE_TARGET_KEY
        : `key:${_key}`
      : _dataset
        ? `${_projectId}/${_dataset}/${getPublishedId(documentId)}`
        : getPublishedId(documentId)
  return `${document}|${perspective.join(',')}|${variant ?? ''}|${publishedOnly ? 'published' : ''}`
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
  // A caller previewing a specific version is not affected by the global selection, so resolve
  // which perspective and variant apply up front: only those take part in the pipeline's identity,
  // and a global perspective or variant change does not resubscribe such a preview. The stack is
  // keyed by contents — callers build theirs inline (`useDocumentTitle` passes `[]`) and the
  // perspective context rebuilds its own whenever the releases change — so a fresh array with the
  // same entries does not rebuild the observable and resubscribe every preview.
  const perspective = useShallowUnique(chosenPerspectiveStackProp ?? perspectiveStack)
  const variant = chosenVariant ?? (chosenPerspectiveStackProp ? undefined : selectedVariantName)

  // The value is a new object on every edit. It enters the pipeline through a subject so the
  // observable identity — and with it the subscription and the field observers it holds — survives
  // keystrokes; a new identity per value would resubscribe and refetch every reference it follows.
  const [value$] = useState(() => new BehaviorSubject<unknown>(previewValue))
  useEffect(() => {
    value$.next(previewValue)
  }, [previewValue, value$])

  const resolveTarget = useCallback(
    (value: unknown): PreviewTarget | undefined => {
      if (!enabled || !value || !schemaType) return undefined

      const goingToUnpublish = isGoingToUnpublish(value as SanityDocument)

      // A document slated for unpublishing is previewed as its published version — outside of any
      // perspective or variant — and none of its own content. Anything else is previewed as it is:
      // a document or reference by its id, an array item (`_key` only) or a plain object in place.
      const previewable: Previewable = goingToUnpublish
        ? {_id: getPublishedId((value as SanityDocument)._id)}
        : (value as Previewable)
      const targetPerspective = goingToUnpublish ? [] : perspective
      const targetVariant = goingToUnpublish ? undefined : variant

      return {
        previewable,
        perspective: targetPerspective,
        variant: targetVariant,
        key: getPreviewTargetKey(previewable, targetPerspective, targetVariant, goingToUnpublish),
      }
    },
    [enabled, schemaType, perspective, variant],
  )

  const observable = useMemo<Observable<Emission>>(
    () =>
      value$.pipe(
        // An edit replaces the changed field on the document, so a shallow compare catches every
        // real change while an equal object built during render (`{_id}` in a dialog) is not
        // previewed again — which would loop whenever `prepare()` returns a fresh media component.
        distinctUntilChanged(shallowEquals),
        scan<unknown, {target: PreviewTarget | undefined; targetChanged: boolean}>(
          (previous, value) => {
            const target = resolveTarget(value)
            return {target, targetChanged: target?.key !== previous.target?.key}
          },
          {target: undefined, targetChanged: false},
        ),
        switchMap(({target, targetChanged}): Observable<Emission> => {
          // this will render previews as "loaded" (i.e. not in loading state) – typically with "Untitled" text
          if (!target || !schemaType) return of({key: null, state: IDLE_STATE})

          const {key} = target
          const preview$ = observeForPreview(target.previewable, schemaType, {
            perspective: target.perspective,
            variant: target.variant,
            viewOptions: {ordering: ordering},
          }).pipe(
            map((event) => ({key, state: {isLoading: false, value: event.snapshot || undefined}})),
            catchError((error) => of({key, state: {isLoading: false, error}})),
          )

          // A different target must not keep showing the previous one's preview while it loads.
          return targetChanged ? concat(of({key, state: INITIAL_STATE}), preview$) : preview$
        }),
        distinctUntilChanged((a, b) => a.key === b.key && isSameState(a.state, b.state)),
      ),
    [value$, resolveTarget, schemaType, observeForPreview, ordering],
  )

  // Do not defer: search/reference UIs assert on preview titles synchronously after selection.
  const emission = useSyncObservable(observable, INITIAL_EMISSION)

  // The subject is fed after commit, so the render that first receives a new value still holds
  // the previous target's emission. Nothing to preview needs no emission at all; otherwise compare
  // against the target this render previews and show loading until the emission catches up, so
  // nothing stale is ever painted.
  const target = resolveTarget(previewValue)
  if (!target) return IDLE_STATE
  return emission.key === target.key ? emission.state : INITIAL_STATE
}
