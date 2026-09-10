import {
  type PreviewValue,
  type SanityDocument,
  type SchemaType,
  type SortOrdering,
} from '@sanity/types'
import {dequal} from 'dequal'
import {useEffect, useMemo, useState} from 'react'
import {useSyncObservable} from 'react-rx'
import {BehaviorSubject, type Observable, of} from 'rxjs'
import {catchError, distinctUntilChanged, map, switchMap} from 'rxjs/operators'

import {type PerspectiveStack} from '../perspective/types'
import {usePerspective} from '../perspective/usePerspective'
import {isGoingToUnpublish} from '../releases/util/isGoingToUnpublish'
import {useDocumentPreviewStore} from '../store/datastores'
import {getPublishedId} from '../util/draftUtils'
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

// Prepared previews are small, so comparing them is cheap. Editing a field the preview does not
// select, or passing an equal value object built during render, then leaves the rendered state
// alone instead of re-rendering every preview consumer (or, for the latter, looping).
function isSameState(a: State, b: State): boolean {
  return a.isLoading === b.isLoading && isSameError(a.error, b.error) && dequal(a.value, b.value)
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
    perspectiveStack: chosenPerspectiveStack,
    variant: chosenVariant,
  } = props || {}
  const {observeForPreview} = useDocumentPreviewStore()
  const {perspectiveStack, selectedVariantName} = usePerspective()

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
        switchMap((value) => {
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

          return observeForPreview(
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
