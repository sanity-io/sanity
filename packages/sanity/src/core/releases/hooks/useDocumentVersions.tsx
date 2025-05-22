import {useEffect, useMemo, useState} from 'react'

import {useDataset} from '../../hooks/useDataset'
import {useProjectId} from '../../hooks/useProjectId'
import {useDocumentPreviewStore} from '../../store'
import {getPublishedId} from '../../util/draftUtils'
import {getOrCreateObservable} from '../../util/getOrCreateObservable'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../util/releasesClient'

export interface DocumentPerspectiveProps {
  documentId: string
}

export interface DocumentPerspectiveState {
  data: string[]
  error?: unknown
  loading: boolean
}

const INITIAL_VALUE = {
  data: [],
  error: null,
  loading: true,
}

/**
 * Fetches the document versions for a given document
 * @param props - document Id of the document (might include release id)
 * @returns - data: document versions, loading, errors
 * @hidden
 * @beta
 */
export function useDocumentVersions(props: DocumentPerspectiveProps): DocumentPerspectiveState {
  const {documentId} = props
  const publishedId = getPublishedId(documentId)

  const dataset = useDataset()
  const projectId = useProjectId()
  const documentPreviewStore = useDocumentPreviewStore()
  const [results, setResults] = useState<DocumentPerspectiveState>(INITIAL_VALUE)
  const filter = `sanity::versionOf("${publishedId}")`
  const apiVersion = RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion

  const observable = useMemo(() => {
    return getOrCreateObservable<DocumentPerspectiveState>({
      documentPreviewStore,
      publishedId,
      projectId,
      dataset,
      filter,
      apiVersion,
      mapValue: (value) => ({
        data: value.documentIds,
        error: null,
        loading: false,
      }),
    })
  }, [dataset, documentPreviewStore, projectId, publishedId, filter, apiVersion])

  useEffect(() => {
    const subscription = observable.subscribe((result) => {
      setResults(result)
    })
    return () => subscription.unsubscribe()
  }, [observable])

  return results
}
