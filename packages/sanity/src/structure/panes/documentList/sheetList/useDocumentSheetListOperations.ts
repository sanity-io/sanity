import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, map} from 'rxjs'
import {useDocumentStore} from 'sanity'

export function useDocumentSheetListOperations(publishedDocIds: string[], docTypeName: string) {
  const documentStore = useDocumentStore()

  const observable = useMemo(
    () =>
      combineLatest(
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
      ),
    [docTypeName, documentStore.pair, publishedDocIds],
  )

  return useObservable(observable, {})
}
