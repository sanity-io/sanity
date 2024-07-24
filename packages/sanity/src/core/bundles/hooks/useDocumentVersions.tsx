import {type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'
import {type BundleDocument} from 'sanity'

import {useClient} from '../../hooks/useClient'
import {listenQuery} from '../../store/_legacy/document/listenQuery'
import {useBundles} from '../../store/bundles/useBundles'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getPublishedId} from '../../util/draftUtils'
import {getBundleSlug} from '../util/util'

export interface DocumentPerspectiveProps {
  documentId: string
}

export interface DocumentPerspectiveState {
  data: BundleDocument[] | null
}

/**
 * Fetches the document versions for a given document
 * @param props - document Id of the document (might include bundle slug)
 * @returns - data: document versions, loading, errors
 * @hidden
 * @beta
 */
export function useDocumentVersions(props: DocumentPerspectiveProps): DocumentPerspectiveState {
  const {documentId} = props

  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {data: bundles} = useBundles()
  const publishedId = getPublishedId(documentId, documentId.includes('.'))

  const QUERY = `*[sanity::versionOf("${publishedId}")]{_id, _version}`

  const observable = useMemo(
    () => listenQuery(client, QUERY) as Observable<Pick<SanityDocument, '_id' | '_version'>[]>,
    [QUERY, client],
  )

  // This will return the sanity documents that are a version of the published document.
  const versions = useObservable(observable, null)

  const state = useMemo(
    () =>
      versions
        ? (versions
            .map((r) => bundles?.find((b) => r._version && getBundleSlug(r._id) === b.slug))
            .filter(Boolean) as BundleDocument[])
        : null,
    [versions, bundles],
  )

  return {
    data: state,
  }
}
