import {Card} from '@sanity/ui'
import {useMemo} from 'react'
import {IntentLink} from 'sanity/router'
import {Box} from 'ui5'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {useDocumentPreviewValues} from '../../../../tasks/hooks/useDocumentPreviewValues'
import {getPublishedId} from '../../../../util/draftUtils'
import {releasesLocaleNamespace} from '../../../i18n'
import {type InjectedTableProps} from '../../components/Table/types'
import {usePublishedDocumentType} from '../hooks/usePublishedDocumentType'
import {type ScheduledDraftMissingDocument} from '../hooks/useScheduledDraftRowDocument'

const PUBLISHED_PERSPECTIVE_STACK: string[] = []
const PUBLISHED_PERSPECTIVE_SEARCH_PARAMS: [string, string][] = [['perspective', 'published']]

function MutedPreview({title, subtitle}: {title: string; subtitle?: string}) {
  return (
    <SanityDefaultPreview
      title={<span style={{color: 'var(--card-muted-fg-color)'}}>{title}</span>}
      subtitle={subtitle}
      layout="default"
    />
  )
}

function PublishedDocumentPreviewLink({
  documentId,
  documentType,
}: {
  documentId: string
  documentType: string
}) {
  const {isLoading, value} = useDocumentPreviewValues({
    documentId,
    documentType,
    perspectiveStack: PUBLISHED_PERSPECTIVE_STACK,
  })
  const params = useMemo(() => ({id: documentId, type: documentType}), [documentId, documentType])

  return (
    <Card
      tone="inherit"
      as={IntentLink}
      intent="edit"
      params={params}
      searchParams={PUBLISHED_PERSPECTIVE_SEARCH_PARAMS}
      radius={2}
      data-as="a"
      data-testid="scheduled-draft-published-document-link"
    >
      <SanityDefaultPreview {...(value || {})} isPlaceholder={isLoading} layout="default" />
    </Card>
  )
}

function PublishedDocumentPreview({documentId}: {documentId: string}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {loading, documentType} = usePublishedDocumentType(documentId)

  if (loading) return <SanityDefaultPreview isPlaceholder layout="default" />
  if (documentType) {
    return <PublishedDocumentPreviewLink documentId={documentId} documentType={documentType} />
  }
  return <MutedPreview title={t('document-preview.no-published-document')} subtitle={documentId} />
}

/**
 * The document column of a scheduled draft that has no document to show. When history has no
 * revision of the document left, the published document is previewed instead, linking to it.
 */
export function ScheduledDraftMissingDocumentPreview({
  cellProps,
  missingDocument,
}: {
  cellProps: InjectedTableProps
  missingDocument: ScheduledDraftMissingDocument
}) {
  const {t} = useTranslation(releasesLocaleNamespace)

  return (
    <Box {...cellProps} flexBasis="0%" flexGrow={1} padding={1} paddingLeft={2} paddingRight={2}>
      {missingDocument.reason === 'history-removed' && (
        <PublishedDocumentPreview documentId={getPublishedId(missingDocument.documentId)} />
      )}
      {missingDocument.reason === 'error' && (
        <MutedPreview
          title={t('document-preview.error')}
          subtitle={missingDocument.documentId && getPublishedId(missingDocument.documentId)}
        />
      )}
      {missingDocument.reason === 'no-document' && (
        <MutedPreview title={t('document-preview.no-document')} />
      )}
    </Box>
  )
}
