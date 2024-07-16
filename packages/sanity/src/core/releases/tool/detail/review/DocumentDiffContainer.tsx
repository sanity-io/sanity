import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {Card, Flex} from '@sanity/ui'
import {
  type BundleDocument,
  getPublishedId,
  LoadingBlock,
  useObserveDocument,
  useSchema,
} from 'sanity'

import {useDocumentPreviewValues} from '../documentTable/useDocumentPreviewValues'
import {type DocumentHistory} from '../documentTable/useReleaseHistory'
import {DocumentReviewHeader} from '../review/DocumentReviewHeader'
import {DocumentDiff} from './DocumentDiff'

export function DocumentDiffContainer({
  document,
  release,
  history,
}: {
  document: SanityDocument
  release: BundleDocument
  history?: DocumentHistory
}) {
  const publishedId = getPublishedId(document._id, true)
  const schema = useSchema()
  const schemaType = schema.get(document._type) as ObjectSchemaType
  if (!schemaType) {
    throw new Error(`Schema type "${document._type}" not found`)
  }
  const {baseDocument, loading: baseDocumentLoading} = useObserveDocument(publishedId, schemaType)
  const {previewValues, isLoading} = useDocumentPreviewValues({document, release})

  return (
    <Card border radius={3}>
      <DocumentReviewHeader
        document={document}
        previewValues={previewValues}
        isLoading={!!isLoading}
        history={history}
        release={release}
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
