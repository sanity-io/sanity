import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, filter, forkJoin, from, map, switchMap} from 'rxjs'

import {useClient} from '../../../../../hooks/useClient'
import {getTransactionsLogs} from '../../../../../store/translog/getTransactionLogs'
import {API_VERSION} from '../../../../../tasks/constants'
import {type DocumentInRelease} from '../../../detail/useBundleDocuments'

export const useAdjacentTransactions = (documents: DocumentInRelease[]) => {
  const client = useClient({apiVersion: API_VERSION})
  const observableClient = client.observable
  const transactionId = documents[0]?.document._rev
  const {dataset} = client.config()

  const hasPostPublishTransactions$ = useMemo(
    () =>
      from(
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
      ),
    [client, documents, transactionId],
  )

  const documentRevertStates$ = useMemo(
    () =>
      from(
        getTransactionsLogs(
          client,
          documents.map(({document}) => document._id),
          {
            toTransaction: transactionId,
            // one transaction for every document plus the publish transaction
            limit: documents.length + 1,
            // // reverse to find the transactions immediately before publish
            reverse: true,
          },
        ),
      ).pipe(
        filter((transactions) => transactions.length > 0),
        map(([publishTransaction, ...otherTransactions]) => otherTransactions),
        map((transactions) =>
          documents.map(({document}) => ({
            docId: document._id,
            // eslint-disable-next-line max-nested-callbacks
            revisionId: transactions.find(({documentIDs}) => documentIDs.includes(document._id))
              ?.id,
          })),
        ),
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

              return (
                observableClient
                  .request<{documents: DocumentInRelease['document'][]}>({
                    url: `/data/history/${dataset}/documents/${docId}?revision=${revisionId}`,
                  })
                  // eslint-disable-next-line max-nested-callbacks
                  .pipe(map((response) => response.documents[0]))
              )
            }),
          ),
        ),
      ),
    [client, dataset, documents, observableClient, transactionId],
  )

  const memoObservable = useMemo(
    () =>
      combineLatest([hasPostPublishTransactions$, documentRevertStates$]).pipe(
        map(([hasPostPublishTransactions, documentRevertStates]) => ({
          hasPostPublishTransactions,
          documentRevertStates,
        })),
      ),
    [hasPostPublishTransactions$, documentRevertStates$],
  )

  return useObservable(memoObservable, {
    hasPostPublishTransactions: null,
    documentRevertStates: null,
  })
}
