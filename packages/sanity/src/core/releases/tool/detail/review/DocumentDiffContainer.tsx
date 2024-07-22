import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {Card, Flex} from '@sanity/ui'

import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {useSchema} from '../../../../hooks/useSchema'
import {useObserveDocument} from '../../../../preview/useObserveDocument'
import {type BundleDocument} from '../../../../store/bundles/types'
import {getPublishedId} from '../../../../util/draftUtils'
import {type DocumentValidationStatus} from '../bundleDocumentsValidation'
import {useDocumentPreviewValues} from '../documentTable/useDocumentPreviewValues'
import {type DocumentHistory} from '../documentTable/useReleaseHistory'
import {DocumentReviewHeader} from '../review/DocumentReviewHeader'
import {DocumentDiff} from './DocumentDiff'

export function DocumentDiffContainer({
  document,
  release,
  history,
  searchTerm,
  validation,
}: {
  document: SanityDocument
  release: BundleDocument
  history?: DocumentHistory
  searchTerm: string
  validation?: DocumentValidationStatus
}) {
  const publishedId = getPublishedId(document._id, true)
  const schema = useSchema()
  const schemaType = schema.get(document._type) as ObjectSchemaType
  if (!schemaType) {
    throw new Error(`Schema type "${document._type}" not found`)
  }
  const {document: baseDocument, loading: baseDocumentLoading} = useObserveDocument(
    publishedId,
    schemaType,
  )
  const {previewValues, isLoading} = useDocumentPreviewValues({document, release})

  if (searchTerm) {
    // Early return to filter out documents that don't match the search term
    const fallbackTitle = typeof document.title === 'string' ? document.title : 'Untitled'
    const title = typeof previewValues.title === 'string' ? previewValues.title : fallbackTitle
    if (!title.toLowerCase().includes(searchTerm.toLowerCase())) return null
  }

  return (
    <Card border radius={3}>
      <DocumentReviewHeader
        document={document}
        previewValues={previewValues}
        isLoading={!!isLoading}
        history={history}
        release={release}
        validation={validation}
      />
      <Flex justify="center" padding={4}>
        {baseDocumentLoading ? (
          <LoadingBlock />
        ) : (
          <DocumentDiff baseDocument={baseDocument} document={document} schemaType={schemaType} />
        )}
      </Flex>
    </Card>
  )
}
