import {type ObjectSchemaType} from '@sanity/types'
import {Card, Flex} from '@sanity/ui'

import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {useSchema} from '../../../../hooks/useSchema'
import {useObserveDocument} from '../../../../preview/useObserveDocument'
import {type BundleDocument} from '../../../../store/bundles/types'
import {getPublishedId} from '../../../../util/draftUtils'
import {type DocumentHistory} from '../documentTable/useReleaseHistory'
import {DocumentReviewHeader} from '../review/DocumentReviewHeader'
import {type DocumentInBundleResult} from '../useBundleDocuments'
import {DocumentDiff} from './DocumentDiff'

function DocumentDiffExpanded({document}: {document: DocumentInBundleResult['document']}) {
  const publishedId = getPublishedId(document._id, true)

  const schema = useSchema()
  const schemaType = schema.get(document._type) as ObjectSchemaType
  if (!schemaType) {
    throw new Error(`Schema type "${document._type}" not found`)
  }

  const {document: baseDocument, loading: baseDocumentLoading} = useObserveDocument(publishedId)

  if (baseDocumentLoading) return <LoadingBlock />

  return <DocumentDiff baseDocument={baseDocument} document={document} schemaType={schemaType} />
}

export function DocumentDiffContainer({
  document,
  history,
  release,
  previewValues,
  validation,
  isExpanded,
  toggleIsExpanded,
}: {
  document: DocumentInBundleResult['document']
  history?: DocumentHistory
  release: BundleDocument
  previewValues: DocumentInBundleResult['previewValues']
  validation?: DocumentInBundleResult['validation']
  isExpanded: boolean
  toggleIsExpanded: () => void
}) {
  return (
    <Card border radius={3} data-testid={`doc-differences-${document._id}`}>
      <DocumentReviewHeader
        document={document}
        isLoading={previewValues.isLoading}
        previewValues={previewValues.values}
        history={history}
        release={release}
        validation={validation}
        isExpanded={isExpanded}
        toggleIsExpanded={toggleIsExpanded}
      />
      {isExpanded && (
        <Flex justify="center" padding={4}>
          <DocumentDiffExpanded document={document} />
        </Flex>
      )}
    </Card>
  )
}
