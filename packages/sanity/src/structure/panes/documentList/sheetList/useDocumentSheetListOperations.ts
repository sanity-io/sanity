import {useMemoObservable} from 'react-rx'
import {combineLatest, map} from 'rxjs'
import {type OperationsAPI, useDocumentStore} from 'sanity'

export function useDocumentSheetListOperations(publishedDocIds: string[], docTypeName: string) {
  const documentStore = useDocumentStore()

  return useMemoObservable<Record<string, OperationsAPI>>(() => {
    return combineLatest(
      publishedDocIds.map((publishedDocId) =>
        documentStore.pair
          .editOperations(publishedDocId, docTypeName)
          .pipe(map((operations) => ({[publishedDocId]: operations}))),
      ),
    ).pipe(
      map((operationsArray) =>
        operationsArray.reduce(
          (accDocumentOperations, documentOperations) => ({
            ...accDocumentOperations,
            ...documentOperations,
          }),
          {},
        ),
      ),
    )
  }, [documentStore.pair, publishedDocIds, docTypeName])
}
