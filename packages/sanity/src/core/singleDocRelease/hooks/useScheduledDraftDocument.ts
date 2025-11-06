import {type SanityDocument} from '@sanity/client'
import {type PreviewValue, type ValidationMarker} from '@sanity/types'

import {useSchema} from '../../hooks'
import {unstable_useValuePreview as useValuePreview} from '../../preview/useValuePreview'
import {useBundleDocuments} from '../../releases/tool/detail/useBundleDocuments'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'

/**
 * Hook to get the first document from a scheduled draft release bundle.
 *
 * @internal
 */
export function useScheduledDraftDocument(
  releaseDocumentId: string | undefined,
  options: {includePreview?: boolean} = {},
): {
  firstDocument: SanityDocument | undefined
  firstDocumentPreview: PreviewValue | undefined
  firstDocumentValidation: ValidationMarker[] | undefined
  documentsCount: number
  loading: boolean
  error: Error | null
  previewLoading: boolean
} {
  const {includePreview = false} = options
  const releaseId = releaseDocumentId ? getReleaseIdFromReleaseDocumentId(releaseDocumentId) : ''
  const {results: documents, loading, error} = useBundleDocuments(releaseId)
  const schema = useSchema()

  const firstDocument = documents?.[0]?.document
  const firstDocumentValidation = documents?.[0]?.validation.validation
  const documentsCount = documents?.length || 0

  const schemaType = firstDocument ? schema.get(firstDocument._type) : null

  const {value: previewValue, isLoading: previewLoading} = useValuePreview({
    enabled: includePreview && !!firstDocument && !!schemaType,
    schemaType: schemaType || undefined,
    value: firstDocument,
  })

  return {
    firstDocument,
    firstDocumentPreview: includePreview ? previewValue : undefined,
    firstDocumentValidation,
    documentsCount,
    loading,
    error,
    previewLoading: includePreview ? previewLoading : false,
  }
}
