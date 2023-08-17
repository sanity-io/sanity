import {map, startWith} from 'rxjs/operators'
import {useMemoObservable} from 'react-rx'
import {SanityDocument} from '@sanity/types'
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
  return useMemoObservable(
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
    INITIAL_STATE,
  )
}
