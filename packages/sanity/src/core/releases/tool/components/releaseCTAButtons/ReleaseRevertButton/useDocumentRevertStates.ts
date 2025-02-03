import {type SanityDocument} from '@sanity/types'
import {useCallback, useEffect, useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'
import {catchError, forkJoin, from, map, type Observable, of, switchMap} from 'rxjs'

import {useClient} from '../../../../../hooks/useClient'
import {getTransactionsLogs} from '../../../../../store/translog/getTransactionsLogs'
import {getPublishedId} from '../../../../../util/draftUtils'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../../../util/releasesClient'
import {type DocumentInRelease} from '../../../detail/useBundleDocuments'

export type RevertDocument = SanityDocument & {
  _system?: {
    delete: true
  }
}

type RevertDocuments = RevertDocument[]

type DocumentRevertStates = RevertDocuments | null | undefined

export const useDocumentRevertStates = (releaseDocuments: DocumentInRelease[]) => {
  const client = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const observableClient = client.observable
  const transactionId = releaseDocuments[0]?.document._rev
  const {dataset} = client.config()

  const resultPromiseRef = useRef<Promise<DocumentRevertStates> | null>(null)
  const resolvedDocumentRevertStatesPromiseRef = useRef<
    ((value: DocumentRevertStates) => void) | null
  >(null)
  const resolvedDocumentRevertStatesResultRef = useRef<DocumentRevertStates | null>(null)

  useEffect(() => {
    if (!resultPromiseRef.current) {
      const {promise, resolve} = Promise.withResolvers<DocumentRevertStates>()

      resultPromiseRef.current = promise
      resolvedDocumentRevertStatesPromiseRef.current = resolve
    }
  }, [])

  const memoDocumentRevertStates = useMemo(() => {
    if (!releaseDocuments.length) return of(undefined)

    const publishedDocuments = releaseDocuments.map(({document}) => ({
      ...document,
      _id: getPublishedId(document._id),
    }))

    const documentRevertStates$: Observable<RevertDocuments | null | undefined> = from(
      getTransactionsLogs(
        client,
        publishedDocuments.map((document) => document._id),
        {
          toTransaction: transactionId,
          // reverse order so most recent publish before release is second element
          // (first is the release publish itself)
          reverse: true,
        },
      ),
    ).pipe(
      map((transactions) => {
        if (transactions.length === 0) throw new Error('No transactions found.')

        const getDocumentTransaction = (docId: string) =>
          // second element is the transaction before the release
          transactions.filter(({documentIDs}) => documentIDs.includes(docId))[1]?.id

        return publishedDocuments.map((document) => ({
          docId: document._id,
          revisionId: getDocumentTransaction(document._id),
        }))
      }),
      switchMap((docRevisionPairs) => {
        if (!docRevisionPairs) return of(undefined)

        return forkJoin(
          docRevisionPairs.map(({docId, revisionId}) => {
            if (!revisionId) {
              const {publishedDocumentExists, ...unpublishDocument} =
                publishedDocuments.find((document) => document._id === docId) || {}

              return of({
                ...unpublishDocument,
                _system: {delete: true},
              } as RevertDocument)
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
                  return of(undefined)
                }),
              )
          }),
        )
      }),
      map((results) => results?.filter((result) => result !== undefined)),
      catchError((err) => {
        console.error('Error in document revert states pipeline:', err)
        return of(undefined)
      }),
    )

    return documentRevertStates$
  }, [client, releaseDocuments, transactionId, observableClient, dataset])

  const documentRevertStatesResult = useObservable(memoDocumentRevertStates, null)

  useEffect(() => {
    if (documentRevertStatesResult !== null) {
      resolvedDocumentRevertStatesResultRef.current = documentRevertStatesResult

      // Resolve promise if it exists
      if (resolvedDocumentRevertStatesPromiseRef.current) {
        resolvedDocumentRevertStatesPromiseRef.current(documentRevertStatesResult)
        resolvedDocumentRevertStatesPromiseRef.current = null
        resultPromiseRef.current = null // Reset resultPromiseRef for future fetches
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
