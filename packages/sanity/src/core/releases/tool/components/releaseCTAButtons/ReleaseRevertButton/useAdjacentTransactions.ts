import {type SanityDocument} from '@sanity/types'
import {useCallback, useEffect, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'
import {catchError, filter, forkJoin, from, map, type Observable, of, switchMap} from 'rxjs'

import {useClient} from '../../../../../hooks/useClient'
import {getTransactionsLogs} from '../../../../../store/translog/getTransactionLogs'
import {API_VERSION} from '../../../../../tasks/constants'
import {type DocumentInRelease} from '../../../detail/useBundleDocuments'

export type RevertDocument = SanityDocument & {
  _system?: {
    delete: boolean
  }
}

type RevertDocuments = RevertDocument[]

type DocumentRevertStates = RevertDocuments | null | undefined

export const useAdjacentTransactions = (documents: DocumentInRelease[]) => {
  const client = useClient({apiVersion: API_VERSION})
  const observableClient = client.observable
  const transactionId = documents[0]?.document._rev
  const {dataset} = client.config()

  const resultPromiseRef = useRef<Promise<DocumentRevertStates> | null>(null)
  const resolvedDocumentRevertStatesPromiseRef = useRef<
    ((value: DocumentRevertStates) => void) | null
  >(null)
  const resolvedDocumentRevertStatesResultRef = useRef<DocumentRevertStates | null>(null)

  useEffect(() => {
    if (!resultPromiseRef.current) {
      resultPromiseRef.current = new Promise((resolve) => {
        resolvedDocumentRevertStatesPromiseRef.current = resolve
      })
    }
  }, [])

  const memoDocumentRevertStates = useMemo(() => {
    if (!documents.length) return of(undefined)

    const documentRevertStates$: Observable<RevertDocuments | null | undefined> = from(
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
      filter(Boolean),
      map((transactions) => {
        if (transactions.length === 0) {
          throw new Error('No transactions found.')
        }

        const [publishTransaction, ...otherTransactions] = transactions

        const getDocumentTransaction = (docId: string) =>
          otherTransactions.find(({documentIDs}) => documentIDs.includes(docId))?.id

        return documents.map(({document}) => ({
          docId: document._id,
          revisionId: getDocumentTransaction(document._id),
        }))
      }),
      switchMap((docRevisionPairs) => {
        if (!docRevisionPairs) return of(undefined) // Pass undefined if no docRevisionPairs

        return forkJoin(
          docRevisionPairs.map(({docId, revisionId}) => {
            if (!revisionId) {
              const {publishedDocumentExists, ...unpublishDocument} =
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
              .pipe(
                map(({documents: [revertDocument]}) => revertDocument),
                catchError((err) => {
                  console.error(`Error fetching document ${docId}:`, err)
                  return of(undefined) // Return undefined for errors
                }),
              )
          }),
        )
      }),
      map((results) => results?.filter((result) => result !== undefined)),
      catchError((err) => {
        console.error('Error in the adjacent transactions pipeline:', err)
        return of(undefined)
      }),
    )

    return documentRevertStates$
  }, [client, documents, transactionId, observableClient, dataset])

  const documentRevertStatesResult = useObservable(memoDocumentRevertStates, null)

  useEffect(() => {
    if (documentRevertStatesResult !== null) {
      resolvedDocumentRevertStatesResultRef.current = documentRevertStatesResult

      // Resolve the promise if it exists
      if (resolvedDocumentRevertStatesPromiseRef.current) {
        resolvedDocumentRevertStatesPromiseRef.current(documentRevertStatesResult)
        resolvedDocumentRevertStatesPromiseRef.current = null
        resultPromiseRef.current = null // Reset the resultPromiseRef for future fetches
      }
    }
  }, [documentRevertStatesResult])

  return useCallback(() => {
    if (resolvedDocumentRevertStatesResultRef.current) {
      // Return resolved value immediately if available
      return Promise.resolve(resolvedDocumentRevertStatesResultRef.current)
    }

    return resultPromiseRef.current
  }, [])
}
