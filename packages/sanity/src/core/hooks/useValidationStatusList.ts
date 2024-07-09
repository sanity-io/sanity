import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, map, type Observable} from 'rxjs'

import {useDocumentStore, type ValidationStatus} from '../store'

/**
 * @internal
 * Takes a list of ids and type and returns the validation status of each document.
 */
export function useValidationStatusList(
  publishedDocIds: string[],
  docTypeName: string,
): (ValidationStatus & {
  publishedDocId: string
})[] {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () =>
      combineLatest(
        publishedDocIds.map((publishedDocId) =>
          documentStore.pair.validation(publishedDocId, docTypeName).pipe(
            map((status) => ({
              ...status,
              publishedDocId,
            })),
          ),
        ),
      ),
    [docTypeName, documentStore.pair, publishedDocIds],
  ) as Observable<
    (ValidationStatus & {
      publishedDocId: string
    })[]
  >

  return useObservable(observable, [])
}
