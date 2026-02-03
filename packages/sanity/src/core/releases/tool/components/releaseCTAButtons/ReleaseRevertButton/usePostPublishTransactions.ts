import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, from, map, of} from 'rxjs'

import {useClient} from '../../../../../hooks/useClient'
import {getTransactionsLogs} from '../../../../../store/translog/getTransactionsLogs'
import {getPublishedId} from '../../../../../util/draftUtils'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../../../util/releasesClient'
import {type DocumentInRelease} from '../../../detail/useBundleDocuments'

export const usePostPublishTransactions = (documents: DocumentInRelease[]) => {
  const client = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const transactionId = documents[0]?.document._rev

  const memoHasPostPublishTransactions = useMemo(() => {
    if (!documents.length) return of(false)

    return from(
      getTransactionsLogs(
        client,
        documents.map(({document}) => getPublishedId(document._id)),
        {
          fromTransaction: transactionId,
          // publish transaction + at least one post publish transaction
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

  return useObservable(memoHasPostPublishTransactions, null)
}
