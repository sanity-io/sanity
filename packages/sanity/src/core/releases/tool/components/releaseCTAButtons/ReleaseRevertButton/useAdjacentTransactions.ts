import {type SanityDocument} from '@sanity/types'
import {useCallback, useEffect, useMemo, useRef} from 'react'
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

type DocumentRevertStates = RevertDocuments | null

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

  const memoDocumentRevertStates = useMemo(() => {
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
              .pipe(map(({documents: [revertDocument]}) => revertDocument))
          }),
        ),
      ),
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

    if (!resultPromiseRef.current) {
      resultPromiseRef.current = new Promise((res) => {
        resolvedDocumentRevertStatesPromiseRef.current = res
      })
    }

    return resultPromiseRef.current
  }, [])
}
