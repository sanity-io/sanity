import {type PreviewValue, type SchemaType, type SortOrdering} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map} from 'rxjs/operators'

import {usePerspective} from '../perspective/usePerspective'
import {useDocumentPreviewStore} from '../store'
import {type Previewable} from './types'

export {useDocumentPreview as useUnstableValuePreview}

/**
 * @internal
 * @deprecated use useValuePreview instead
 */
export function unstable_useValuePreview(args: Parameters<typeof useDocumentPreview>[0]) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useDocumentPreview(args)
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

    return observeForPreview(previewValue as Previewable, schemaType, {
      perspective: perspectiveStack,
      viewOptions: {ordering: ordering},
    }).pipe(
      map((event) => ({isLoading: false, value: event.snapshot || undefined})),
      catchError((error) => of({isLoading: false, error})),
    )
  }, [enabled, previewValue, schemaType, observeForPreview, perspectiveStack, ordering])

  return useObservable(observable, INITIAL_STATE)
}
