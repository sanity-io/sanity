import {
  type PreviewValue,
  type SanityDocument,
  type SchemaType,
  type SortOrdering,
} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map} from 'rxjs/operators'

import {type PerspectiveStack} from '../perspective/types'
import {usePerspective} from '../perspective/usePerspective'
import {isGoingToUnpublish} from '../releases/util/isGoingToUnpublish'
import {useDocumentPreviewStore} from '../store'
import {getPublishedId} from '../util'
import {type Previewable} from './types'

/**
 * @internal
 * @deprecated use useValuePreview instead
 */
export function unstable_useValuePreview(args: Parameters<typeof useValuePreview>[0]) {
  // oxlint-disable-next-line react-hooks/rules-of-hooks -- deprecated wrapper for backwards compatibility
  return useValuePreview(args)
}

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
}): State {
  const {
    enabled = true,
    ordering,
    schemaType,
    value: previewValue,
    perspectiveStack: chosenPerspectiveStack,
  } = props || {}
  const {observeForPreview} = useDocumentPreviewStore()
  const {perspectiveStack} = usePerspective()
  const observable = useMemo<Observable<State>>(() => {
    // this will render previews as "loaded" (i.e. not in loading state) – typically with "Untitled" text
    if (!enabled || !previewValue || !schemaType) return of(IDLE_STATE)

    const updatedStack = isGoingToUnpublish(previewValue as SanityDocument)
      ? []
      : (chosenPerspectiveStack ?? perspectiveStack)
    const updatedDocId = isGoingToUnpublish(previewValue as SanityDocument)
      ? getPublishedId((previewValue as SanityDocument)._id)
      : (previewValue as SanityDocument)._id

    // allow for previewing the published document when a version is slated for unpublishing
    // but if it's not for unpublishing, then we want to preview the content as was before
    const restPreviewValue = isGoingToUnpublish(previewValue as SanityDocument)
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
    observeForPreview,
    ordering,
  ])

  return useObservable(observable, INITIAL_STATE)
}
