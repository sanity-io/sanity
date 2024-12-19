import {type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map, startWith} from 'rxjs/operators'

import {useDocumentStore} from '../store'

interface ReferringDocumentsState<Doc> {
  isLoading: boolean
  referringDocuments: Doc[]
}
/** @beta */
export type DocumentField = Exclude<keyof SanityDocument, number>

const INITIAL_STATE: ReferringDocumentsState<never> = {referringDocuments: [], isLoading: true}
const DEFAULT_FIELDS: DocumentField[] = ['_id', '_type']

/**
 * @beta
 * Subscribe to a live-updating list document referring to the document of the passed ID
 * A new list of document will be emitted every time a document refers or no longer refers to the document of the given ID
 *
 * ## Gotcha
 * The returned list of referring documents is not extensive, will only return the 101 first documents.
 *
 * ## Gotcha
 * For every component that calls this hook, a new listener connection will be made to the backed.
 *
 * Make sure call this hook sparingly
 * @param id - id of document to search for referring documents for
 * @param fields - which fields to return for each document (defaults to _id and _type). Pass an empty array to return full documents
 */
export function useReferringDocuments<DocumentType extends SanityDocument>(
  id: string,
  fields: DocumentField[] = DEFAULT_FIELDS,
) {
  const documentStore = useDocumentStore()

  const projection = useMemo(() => {
    return fields.length === 0 ? '' : fields.join(',')
  }, [fields])

  const observable = useMemo(
    () =>
      documentStore
        .listenQuery(
          `*[references($docId)] [0...101]${projection}`,
          {docId: id},
          {tag: 'use-referring-documents'},
        )
        .pipe(
          map(
            (docs: DocumentType[]): ReferringDocumentsState<DocumentType> => ({
              referringDocuments: docs,
              isLoading: false,
            }),
          ),
          startWith(INITIAL_STATE),
        ),
    [documentStore, id, projection],
  )
  return useObservable(observable, INITIAL_STATE)
}

const EMPTY_FIELDS: never[] = []
/**
 * Kept for backwards compat
 * - useReferringDocuments(id) will select `{_id, _type}` from returned documents,
 * - while this hook will return full documents
 *
 * Internal callers of this hook should migrate over to useReferringDocuments
 * @deprecated - replaced by useReferringDocuments(id) but kept for backwards compatibility
 * @internal
 * @param id - id of document to search for referring documents for
 */
// eslint-disable-next-line camelcase
export function useLegacyReferringDocuments(id: string): ReferringDocumentsState<SanityDocument> {
  return useReferringDocuments(id, EMPTY_FIELDS)
}
