import {type SanityDocument} from '@sanity/types'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useObservable} from 'react-rx'
import {filter, forkJoin, from, map, type Observable, of, switchMap} from 'rxjs'

import {useClient} from '../../../../../hooks/useClient'
import {getTransactionsLogs} from '../../../../../store/translog/getTransactionLogs'
import {API_VERSION} from '../../../../../tasks/constants'
import {type DocumentInRelease} from '../../../detail/useBundleDocuments'

type RevertDocument = SanityDocument & {
  _system?: {
    delete: boolean
  }
}

type RevertDocuments = RevertDocument[]

interface AdjacentTransactionsResult {
  documentRevertStates: RevertDocuments | null
}

export const useAdjacentTransactions = (documents: DocumentInRelease[]) => {
  const client = useClient({apiVersion: API_VERSION})
  const observableClient = client.observable
  const transactionId = documents[0]?.document._rev
  const {dataset} = client.config()
  const [trigger, setTrigger] = useState(0)
  const promiseRef = useRef<Promise<AdjacentTransactionsResult['documentRevertStates']> | null>(
    null,
  )
  const resolvePromiseRef = useRef<
    ((value: AdjacentTransactionsResult['documentRevertStates']) => void) | null
  >(null)
  const resolvedValueRef = useRef<AdjacentTransactionsResult['documentRevertStates'] | null>(null)

  const memoObservable = useMemo(() => {
    if (!trigger) {
      // If not triggered, return null to prevent the observable from running
      return of(null)
    }

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
                ...(unpublishDocument as SanityDocument),
                _system: {delete: true},
              })
            }

            return observableClient
              .request<{
                documents: RevertDocuments
              }>({
                url: `/data/history/${dataset}/documents/${docId}?revision=${revisionId}`,
              })
              .pipe(map((response) => response.documents[0]))
          }),
        ),
      ),
    )

    return documentRevertStates$
  }, [trigger, client, documents, transactionId, observableClient, dataset])

  const observableResult = useObservable(memoObservable, null)

  useEffect(() => {
    if (observableResult !== null) {
      resolvedValueRef.current = observableResult

      // Resolve the promise if it exists
      if (resolvePromiseRef.current) {
        resolvePromiseRef.current(observableResult)
        resolvePromiseRef.current = null
        promiseRef.current = null // Reset the promiseRef for future fetches
      }
    }
  }, [observableResult])

  const startObservables = useCallback(() => {
    if (resolvedValueRef.current) {
      // Return resolved value immediately if available
      return Promise.resolve(resolvedValueRef.current)
    }

    if (!promiseRef.current) {
      promiseRef.current = new Promise((res) => {
        resolvePromiseRef.current = res
        setTrigger((curTrigger) => curTrigger + 1)
      })
    }

    return promiseRef.current
  }, [])

  return useMemo(
    () => ({
      documentRevertStates: observableResult,
      getAdjacentTransactions: startObservables,
    }),
    [observableResult, startObservables],
  )
}
