import {PreviewValue, SchemaType, SortOrdering} from '@sanity/types'
import {useEffect, useState} from 'react'
import {catchError, distinctUntilChanged, map, tap} from 'rxjs/operators'
import {of} from 'rxjs'
import {useDocumentPreviewStore} from '../store'
import {Previewable} from './types'

export {useDocumentPreview as unstable_useDocumentPreview}

interface State {
  isLoading: boolean
  error?: Error
  value?: PreviewValue
}
const INITIAL_STATE: State = {
  isLoading: true,
}
/**
 * @internal
 * @deprecated FOR INTERNAL USE.
 */
function useDocumentPreview(props: {
  enabled?: boolean
  ordering?: SortOrdering
  schemaType?: SchemaType
  value: Previewable | undefined
}): State {
  const {enabled = true, ordering, schemaType, value: previewValue} = props || {}
  const {observeForPreview} = useDocumentPreviewStore()
  const [state, setState] = useState<State>(INITIAL_STATE)
  useEffect(() => {
    if (!enabled || !previewValue || !schemaType) return undefined

    const snapshotEvent$ = observeForPreview(previewValue, schemaType, {ordering})

    const sub = snapshotEvent$
      .pipe(
        map((event) => ({isLoading: false, value: event.snapshot || undefined})),
        catchError((error) => of({isLoading: false, error})),
        tap((nextState) => setState(nextState))
      )
      .subscribe()

    return () => sub.unsubscribe()
  }, [enabled, observeForPreview, ordering, schemaType, previewValue])

  return state
}
