import {type ObjectSchemaType} from '@sanity/types'
import {Card, Flex} from '@sanity/ui'

import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {useSchema} from '../../../../hooks/useSchema'
import {useObserveDocument} from '../../../../preview/useObserveDocument'
import {type BundleDocument} from '../../../../store/bundles/types'
import {getPublishedId} from '../../../../util/draftUtils'
import {type DocumentHistory} from '../documentTable/useReleaseHistory'
import {DocumentReviewHeader} from '../review/DocumentReviewHeader'
import {type BundleDocumentResult} from '../useBundleDocuments'
import {DocumentDiff} from './DocumentDiff'

export function DocumentDiffContainer({
  document,
  release,
  history,
  previewValues,
  validation,
}: {
  release: BundleDocument
  history?: DocumentHistory
  document: BundleDocumentResult['document']
  validation?: BundleDocumentResult['validation']
  previewValues: BundleDocumentResult['previewValues']
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

  return (
    <Card border radius={3}>
      <DocumentReviewHeader
        document={document}
        isLoading={previewValues.isLoading}
        previewValues={previewValues.values}
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
