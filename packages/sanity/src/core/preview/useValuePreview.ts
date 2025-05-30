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

import {usePerspective} from '../perspective/usePerspective'
import {isGoingToUnpublish} from '../releases/util/isGoingToUnpublish'
import {useDocumentPreviewStore} from '../store'
import {type Previewable} from './types'

export {useDocumentPreview as unstable_useValuePreview}

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
 * @deprecated FOR INTERNAL USE.
 */
function useDocumentPreview(props: {
  enabled?: boolean
  ordering?: SortOrdering
  schemaType?: SchemaType
  value: unknown | undefined
}): State {
  const {enabled = true, ordering, schemaType, value: previewValue} = props || {}
  const {observeForPreview} = useDocumentPreviewStore()
  const {perspectiveStack} = usePerspective()
  const observable = useMemo<Observable<State>>(() => {
    // this will render previews as "loaded" (i.e. not in loading state) – typically with "Untitled" text
    if (!enabled || !previewValue || !schemaType) return of(IDLE_STATE)

    const updatedStack =
      // when a version is slated for unpublishing then we need to remove the version from the stack
      // and use the next one down
      perspectiveStack.length > 1 && isGoingToUnpublish(previewValue as SanityDocument)
        ? perspectiveStack.slice(1)
        : perspectiveStack

    return observeForPreview(previewValue as Previewable, schemaType, {
      perspective: updatedStack,
      viewOptions: {ordering: ordering},
    }).pipe(
      map((event) => ({isLoading: false, value: event.snapshot || undefined})),
      catchError((error) => of({isLoading: false, error})),
    )
  }, [enabled, previewValue, schemaType, observeForPreview, perspectiveStack, ordering])

  return useObservable(observable, INITIAL_STATE)
}
