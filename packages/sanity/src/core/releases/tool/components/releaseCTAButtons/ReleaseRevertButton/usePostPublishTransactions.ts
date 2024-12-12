import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, from, map, of} from 'rxjs'

import {useClient} from '../../../../../hooks/useClient'
import {getTransactionsLogs} from '../../../../../store/translog/getTransactionLogs'
import {API_VERSION} from '../../../../../tasks/constants'
import {type DocumentInRelease} from '../../../detail/useBundleDocuments'

export const usePostPublishTransactions = (documents: DocumentInRelease[]) => {
  const client = useClient({apiVersion: API_VERSION})
  const transactionId = documents[0]?.document._rev

  const memoObservable = useMemo(() => {
    // Observable to check if there are post-publish transactions
    return from(
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
      catchError(() => of(null)),
    )
  }, [client, documents, transactionId])

  const observableResult = useObservable(memoObservable, null)

  return observableResult
}
