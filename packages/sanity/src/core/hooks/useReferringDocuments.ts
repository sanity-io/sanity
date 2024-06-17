import {type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map, startWith} from 'rxjs/operators'

import {useDocumentStore} from '../store'

interface ReferringDocumentsState {
  isLoading: boolean
  referringDocuments: SanityDocument[]
}

const INITIAL_STATE: ReferringDocumentsState = {referringDocuments: [], isLoading: true}

/**
 * @internal
 * @param id - the id to search for referring documents for
 */
export function useReferringDocuments(id: string): ReferringDocumentsState {
  const documentStore = useDocumentStore()
  const observable = useMemo(
    () =>
      documentStore
        .listenQuery(
          '*[references($docId)] [0...101]',
          {docId: id},
          {tag: 'use-referring-documents'},
        )
        .pipe(
          map(
            (docs: SanityDocument[]): ReferringDocumentsState => ({
              referringDocuments: docs,
              isLoading: false,
            }),
          ),
          startWith(INITIAL_STATE),
        ),
    [documentStore, id],
  )
  return useObservable(observable, INITIAL_STATE)
}
