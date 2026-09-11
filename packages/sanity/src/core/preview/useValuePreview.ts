import {
  type PreviewValue,
  type SanityDocument,
  type SchemaType,
  type SortOrdering,
} from '@sanity/types'
import {dequal} from 'dequal/lite'
import {useEffect, useMemo, useState} from 'react'
import isEqual from 'react-fast-compare'
import {useSyncObservable} from 'react-rx'
import {BehaviorSubject, type Observable, of} from 'rxjs'
import {catchError, distinctUntilChanged, map, switchMap} from 'rxjs/operators'

import {type PerspectiveStack} from '../perspective/types'
import {usePerspective} from '../perspective/usePerspective'
import {isGoingToUnpublish} from '../releases/util/isGoingToUnpublish'
import {useDocumentPreviewStore} from '../store/datastores'
import {getPublishedId} from '../util/draftUtils'
import {type ObserveForPreviewFn} from './documentPreviewStore'
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

const IDLE_STATE_OBSERVABLE = of(IDLE_STATE)

/**
 * Everything the preview is derived from apart from the schema type and the identity of the
 * previewed document. These stream into the live preview observable, so a change updates the
 * preview in place instead of restarting the subscription.
 */
interface PreviewInputs {
  value: unknown
  chosenPerspectiveStack: PerspectiveStack | undefined
  perspectiveStack: PerspectiveStack
  chosenVariant: string | undefined
  selectedVariantName: string | undefined
  ordering: SortOrdering | undefined
}

interface PreviewTarget {
  previewable: Previewable
  perspective: PerspectiveStack
  variant: string | undefined
}

/**
 * The id `observeForPreview` will observe for a value. A change means a different document is
 * being previewed, which restarts the preview so the previous document's preview is never shown
 * for the new one.
 */
function getPreviewDocumentId(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const document = value as SanityDocument & {_ref?: string}
  if (isGoingToUnpublish(document)) return getPublishedId(document._id)
  return document._id ?? document._ref
}

function resolvePreviewTarget(inputs: PreviewInputs): PreviewTarget | undefined {
  const {value, chosenPerspectiveStack, perspectiveStack, chosenVariant, selectedVariantName} =
    inputs
  if (!value) return undefined

  const document = value as SanityDocument
  // A document slated for unpublishing is previewed as its published version, which is outside
  // of any variant. Otherwise the variant follows the perspective: only inherited from the
  // context when the perspective is too.
  if (isGoingToUnpublish(document)) {
    return {previewable: {_id: getPublishedId(document._id)}, perspective: [], variant: undefined}
  }
  return {
    previewable: {_id: document._id, ...(value as Previewable)},
    perspective: chosenPerspectiveStack ?? perspectiveStack,
    variant: chosenVariant ?? (chosenPerspectiveStack ? undefined : selectedVariantName),
  }
}

function isSameState(a: State, b: State): boolean {
  return a.isLoading === b.isLoading && a.error === b.error && isEqual(a.value, b.value)
}

function createPreviewObservable(
  inputs$: Observable<PreviewInputs>,
  schemaType: SchemaType,
  observeForPreview: ObserveForPreviewFn,
): Observable<State> {
  return inputs$.pipe(
    distinctUntilChanged(dequal),
    switchMap((inputs) => {
      const target = resolvePreviewTarget(inputs)
      // this will render previews as "loaded" (i.e. not in loading state) – typically with "Untitled" text
      if (!target) return IDLE_STATE_OBSERVABLE

      return observeForPreview(target.previewable, schemaType, {
        perspective: target.perspective,
        variant: target.variant,
        viewOptions: {ordering: inputs.ordering},
      }).pipe(
        map((event): State => ({isLoading: false, value: event.snapshot || undefined})),
        catchError((error) => of<State>({isLoading: false, error})),
      )
    }),
    distinctUntilChanged(isSameState),
  )
}

/**
 * A subject holding the latest inputs. It is replaced together with the observable that reads it,
 * whenever `enabled`, the schema type or the previewed document changes, and seeded with the current
 * render's inputs so the new observable never previews the inputs of an earlier render. Every other
 * change is pushed into the existing subject after commit.
 */
function useInputsSubject(
  enabled: boolean,
  schemaType: SchemaType | undefined,
  inputs: PreviewInputs,
): BehaviorSubject<PreviewInputs> {
  const documentId = getPreviewDocumentId(inputs.value)
  const [current, setCurrent] = useState(() => ({
    enabled,
    schemaType,
    documentId,
    inputs$: new BehaviorSubject(inputs),
  }))

  let {inputs$} = current
  if (
    current.enabled !== enabled ||
    current.schemaType !== schemaType ||
    current.documentId !== documentId
  ) {
    inputs$ = new BehaviorSubject(inputs)
    setCurrent({enabled, schemaType, documentId, inputs$})
  }

  useEffect(() => {
    inputs$.next(inputs)
  }, [inputs$, inputs])

  return inputs$
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
    value,
    perspectiveStack: chosenPerspectiveStack,
    variant: chosenVariant,
  } = props || {}
  const {observeForPreview} = useDocumentPreviewStore()
  const {perspectiveStack, selectedVariantName} = usePerspective()

  const inputs = useMemo<PreviewInputs>(
    () => ({
      value,
      chosenPerspectiveStack,
      perspectiveStack,
      chosenVariant,
      selectedVariantName,
      ordering,
    }),
    [value, chosenPerspectiveStack, perspectiveStack, chosenVariant, selectedVariantName, ordering],
  )
  const inputs$ = useInputsSubject(enabled, schemaType, inputs)

  // Only `enabled`, the schema type and the previewed document change the observable's identity,
  // which is what restarts the subscription and renders the loading state. Everything else
  // streams through `inputs$` into the observable that is already subscribed.
  const observable = useMemo<Observable<State>>(
    () =>
      enabled && schemaType
        ? createPreviewObservable(inputs$, schemaType, observeForPreview)
        : IDLE_STATE_OBSERVABLE,
    [enabled, inputs$, observeForPreview, schemaType],
  )

  // Do not defer: search/reference UIs assert on preview titles synchronously after selection.
  return useSyncObservable(observable, INITIAL_STATE)
}
