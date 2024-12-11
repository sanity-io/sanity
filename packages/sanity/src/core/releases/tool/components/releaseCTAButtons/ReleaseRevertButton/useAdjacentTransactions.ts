import {useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {
  combineLatest,
  delay,
  filter,
  forkJoin,
  from,
  map,
  type Observable,
  of,
  switchMap,
} from 'rxjs'

import {useClient} from '../../../../../hooks/useClient'
import {getTransactionsLogs} from '../../../../../store/translog/getTransactionLogs'
import {API_VERSION} from '../../../../../tasks/constants'
import {type DocumentInRelease} from '../../../detail/useBundleDocuments'

type RevertDocuments = (Omit<DocumentInRelease['document'], 'publishedDocumentExists'> & {
  _system?: {
    delete: boolean
  }
})[]

interface AdjacentTransactionsResult {
  hasPostPublishTransactions: boolean | null
  documentRevertStates: RevertDocuments | null
}

export const useAdjacentTransactions = (documents: DocumentInRelease[]) => {
  const client = useClient({apiVersion: API_VERSION})
  const observableClient = client.observable
  const transactionId = documents[0]?.document._rev
  const {dataset} = client.config()
  const [trigger, setTrigger] = useState(0)
  const [resolvePromise, setResolvePromise] = useState<
    ((result: AdjacentTransactionsResult) => void) | null
  >(null)

  const memoObservable = useMemo(() => {
    if (!trigger) {
      // If not triggered, return null to prevent the observable from running
      return of({
        hasPostPublishTransactions: null,
        documentRevertStates: null,
      })
    }

    // Observable to check if there are post-publish transactions
    const hasPostPublishTransactions$ = from(
      getTransactionsLogs(
        client,
        documents.map(({document}) => document._id),
        {
          fromTransaction: transactionId,
          // one transaction for every document plus the publish transaction
          limit: 2,
        },
      ),
    ).pipe(
      // the transaction of published is also returned
      // so post publish transactions will result in more than 1 transaction
      map((transactions) => transactions.length > 1),
    )

    // Observable to get the revert states of the documents
    const documentRevertStates$: Observable<RevertDocuments> = from(
      getTransactionsLogs(
        client,
        documents.map(({document}) => document._id),
        {
          toTransaction: transactionId,
          // one transaction for every document plus the publish transaction
          limit: documents.length + 1,
          // reverse to find the transactions immediately before publish
          reverse: true,
        },
      ),
    ).pipe(
      filter((transactions) => transactions.length > 0),
      map(([publishTransaction, ...otherTransactions]) => {
        const getDocumentTransaction = (docId: string) =>
          otherTransactions.find(({documentIDs}) => documentIDs.includes(docId))?.id

        return documents.map(({document}) => ({
          docId: document._id,
          revisionId: getDocumentTransaction(document._id),
        }))
      }),
      switchMap((docRevisionPairs) =>
        forkJoin(
          docRevisionPairs.map(({docId, revisionId}) => {
            if (!revisionId) {
              const {publishedDocumentExists, ...unpublishDocument} =
                // eslint-disable-next-line max-nested-callbacks
                documents.find(({document}) => document._id === docId)?.document || {}

              return of({
                _id: docId,
                ...unpublishDocument,
                _system: {delete: true},
              })
            }

            return observableClient
              .request<{
                documents: Omit<DocumentInRelease['document'], 'publishedDocumentExists'>[]
              }>({
                url: `/data/history/${dataset}/documents/${docId}?revision=${revisionId}`,
              })
              .pipe(
                map((response) => response.documents[0]),
                delay(5000),
              )
          }),
        ),
      ),
    )

    return combineLatest([hasPostPublishTransactions$, documentRevertStates$]).pipe(
      map(([hasPostPublishTransactions, documentRevertStates]) => {
        const result = {hasPostPublishTransactions, documentRevertStates}

        if (resolvePromise) {
          resolvePromise(result)
          setResolvePromise(null)
        }
        return result
      }),
    )
  }, [trigger, client, documents, transactionId, observableClient, dataset, resolvePromise])

  const observableResult = useObservable(memoObservable, {
    hasPostPublishTransactions: null,
    documentRevertStates: null,
  })

  const startObservables = useCallback(() => {
    if (resolvePromise) return resolvePromise

    return new Promise((res) => {
      setResolvePromise(() => res)
      setTrigger((curTrigger) => curTrigger + 1)
    })
  }, [resolvePromise])

  return {
    ...observableResult,
    getAdjacentTransactions: startObservables,
  }
}
