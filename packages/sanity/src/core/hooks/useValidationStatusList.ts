import {useMemoObservable} from 'react-rx'
import {combineLatest, map} from 'rxjs'

import {useDocumentStore, type ValidationStatus} from '../store'

export function useValidationStatusList(
  publishedDocIds: string[],
  docTypeName: string,
): (ValidationStatus & {
  publishedDocId: string
})[] {
  const documentStore = useDocumentStore()

  return useMemoObservable(() => {
    return combineLatest(
      publishedDocIds.map((publishedDocId) =>
        documentStore.pair.validation(publishedDocId, docTypeName).pipe(
          map((status) => ({
            ...status,
            publishedDocId,
          })),
        ),
      ),
    )
  }, [documentStore.pair, publishedDocIds, docTypeName]) as (ValidationStatus & {
    publishedDocId: string
  })[]
}
