import {type ObjectSchemaType} from '@sanity/types'
import {Card, Flex} from '@sanity/ui'
import {memo} from 'react'

import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {useSchema} from '../../../../hooks/useSchema'
import {useObserveDocument} from '../../../../preview/useObserveDocument'
import {getPublishedId} from '../../../../util/draftUtils'
import {type DocumentHistory} from '../documentTable/useReleaseHistory'
import {DocumentReviewHeader} from '../review/DocumentReviewHeader'
import {type DocumentInRelease} from '../useBundleDocuments'
import {DocumentDiff} from './DocumentDiff'

const DocumentDiffExpanded = memo(
  function DocumentDiffExpanded({document}: {document: DocumentInRelease['document']}) {
    const publishedId = getPublishedId(document._id)

    const schema = useSchema()
    const schemaType = schema.get(document._type) as ObjectSchemaType
    if (!schemaType) {
      throw new Error(`Schema type "${document._type}" not found`)
    }

    const {document: baseDocument, loading: baseDocumentLoading} = useObserveDocument(publishedId)

    if (baseDocumentLoading) return <LoadingBlock />

    return <DocumentDiff baseDocument={baseDocument} document={document} schemaType={schemaType} />
  },
  (prev, next) => prev.document._rev === next.document._rev,
)

export const DocumentDiffContainer = memo(
  function DocumentDiffContainer({
    item,
    history,
    releaseSlug,
    isExpanded,
    toggleIsExpanded,
  }: {
    history?: DocumentHistory
    releaseSlug: string
    item: DocumentInRelease
    isExpanded: boolean
    toggleIsExpanded: () => void
  }) {
    return (
      <Card border radius={3} data-testid={`doc-differences-${item.document._id}`}>
        <DocumentReviewHeader
          document={item.document}
          isLoading={item.previewValues.isLoading}
          previewValues={item.previewValues.values}
          history={history}
          releaseId={releaseSlug}
          validation={item.validation}
          isExpanded={isExpanded}
          toggleIsExpanded={toggleIsExpanded}
        />
        {isExpanded && (
          <Flex justify="center" padding={4}>
            <DocumentDiffExpanded document={item.document} />
          </Flex>
        )}
      </Card>
    )
  },
  (prev, next) => {
    return (
      prev.item.memoKey === next.item.memoKey &&
      prev.isExpanded === next.isExpanded &&
      prev.history?.lastEditedBy === next.history?.lastEditedBy
    )
  },
)
