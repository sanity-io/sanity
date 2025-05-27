import {type PreviewValue, type SchemaType, type SortOrdering} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map, switchMap} from 'rxjs/operators'

import {usePerspective} from '../perspective/usePerspective'
import {useDocumentPreviewStore} from '../store'
import {getDraftId, getVersionId} from '../util'
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
  const documentId = (previewValue as {_id?: string})?._id

  const observable = useMemo<Observable<State>>(() => {
    // this will render previews as "loaded" (i.e. not in loading state) – typically with "Untitled" text
    if (!enabled || !previewValue || !schemaType) return of(IDLE_STATE)

    return observeForPreview(previewValue as Previewable, schemaType, {
      perspective: perspectiveStack,
      viewOptions: {ordering: ordering},
    }).pipe(
      switchMap((value) => {
        if (value.snapshot) {
          return of(value)
        }

        //If we don't receive a snapshot here, it means the document will be unpublished in the release.
        // In which case, to preview it we need its latest known version instead (e.g. one perspective stack level up)
        // To do this we need to remove the first item from the start of the array
        const updatedPerspectiveStack =
          perspectiveStack.length > 1 ? perspectiveStack.slice(1) : perspectiveStack

        const previousPerspective = updatedPerspectiveStack[0]

        // chosen drafts over published version since the drafts are how the document is most often known about
        // across the studio (for example, document lists previews)
        // if the previous perspective is drafts then it means that there is only one document
        // otherwise, we need to get the version id of the previous perspective
        const docId =
          previousPerspective === 'drafts'
            ? getDraftId(documentId || '')
            : getVersionId(documentId || '', previousPerspective)

        return observeForPreview(
          {
            _id: docId,
          },
          schemaType,
          {
            perspective: updatedPerspectiveStack,
          },
        )
      }),
      map((event) => ({isLoading: false, value: event.snapshot}) as State),
      catchError((error) => of({isLoading: false, error})),
    )
  }, [enabled, previewValue, schemaType, observeForPreview, perspectiveStack, ordering, documentId])

  return useObservable(observable, INITIAL_STATE)
}
