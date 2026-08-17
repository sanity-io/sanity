import {
  type PreviewValue,
  type SanityDocument,
  type SchemaType,
  type SortOrdering,
} from '@sanity/types'
import {useMemo} from 'react'
import {useSyncObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map} from 'rxjs/operators'

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
  const observable = useMemo<Observable<State>>(() => {
    // this will render previews as "loaded" (i.e. not in loading state) – typically with "Untitled" text
    if (!enabled || !previewValue || !schemaType) return of(IDLE_STATE)

    const goingToUnpublish = isGoingToUnpublish(previewValue as SanityDocument)

    const updatedStack = goingToUnpublish ? [] : (chosenPerspectiveStack ?? perspectiveStack)
    // A document slated for unpublishing is previewed as its published version, which is outside
    // of any variant. Otherwise the variant follows the perspective: only inherited from the
    // context when the perspective is too.
    const updatedVariant = goingToUnpublish
      ? undefined
      : (chosenVariant ?? (chosenPerspectiveStack ? undefined : selectedVariantName))
    const updatedDocId = goingToUnpublish
      ? getPublishedId((previewValue as SanityDocument)._id)
      : (previewValue as SanityDocument)._id

    // allow for previewing the published document when a version is slated for unpublishing
    // but if it's not for unpublishing, then we want to preview the content as was before
    const restPreviewValue = goingToUnpublish
      ? {}
      : {
          ...(previewValue as Previewable),
        }

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
  }, [
    enabled,
    previewValue,
    schemaType,
    chosenPerspectiveStack,
    perspectiveStack,
    chosenVariant,
    selectedVariantName,
    observeForPreview,
    ordering,
  ])

  // Do not defer: search/reference UIs assert on preview titles synchronously after selection.
  return useSyncObservable(observable, INITIAL_STATE)
}
