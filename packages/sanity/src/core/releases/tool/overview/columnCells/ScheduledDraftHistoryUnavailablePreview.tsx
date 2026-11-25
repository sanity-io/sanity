import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Card} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map} from 'rxjs'
import {IntentLink} from 'sanity/router'
import {Box, Flex, Icon} from 'ui5'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {useDocumentPreviewStore} from '../../../../store/datastores'
import {useDocumentPreviewValues} from '../../../../tasks/hooks/useDocumentPreviewValues'
import {getPublishedId} from '../../../../util/draftUtils'
import {releasesLocaleNamespace} from '../../../i18n'
import {type InjectedTableProps} from '../../components/Table/types'

interface PublishedDocumentTypeState {
  loading: boolean
  documentType: string | undefined
}

const LOADING_DOCUMENT_TYPE: PublishedDocumentTypeState = {loading: true, documentType: undefined}
const PUBLISHED_PERSPECTIVE_STACK: string[] = []
const PUBLISHED_PERSPECTIVE_SEARCH_PARAMS: [string, string][] = [['perspective', 'published']]

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
  const documentPreviewStore = useDocumentPreviewStore()
  const documentType$ = useMemo(
    () =>
      documentPreviewStore
        .observeDocumentTypeFromId(documentId)
        .pipe(map((documentType): PublishedDocumentTypeState => ({loading: false, documentType}))),
    [documentPreviewStore, documentId],
  )
  const {loading, documentType} = useObservable(documentType$, LOADING_DOCUMENT_TYPE)

  if (documentType) {
    return <PublishedDocumentPreviewLink documentId={documentId} documentType={documentType} />
  }
  return (
    <SanityDefaultPreview
      isPlaceholder={loading}
      title={t('document-preview.no-published-document')}
      layout="default"
    />
  )
}

/**
 * The document preview of a published or archived scheduled draft whose document has no revision
 * left in history, because the dataset's history retention has removed it. Previews the published
 * document instead, linking to it, and explains why with an info icon.
 */
export function ScheduledDraftHistoryUnavailablePreview({
  cellProps,
  documentId,
}: {
  cellProps: InjectedTableProps
  documentId: string
}) {
  const {t} = useTranslation(releasesLocaleNamespace)

  return (
    <Box {...cellProps} flexBasis="0%" flexGrow={1} padding={1} paddingLeft={2} paddingRight={2}>
      <Flex alignItems="center" gap={2}>
        <Box flexBasis="0%" flexGrow={1}>
          <PublishedDocumentPreview documentId={getPublishedId(documentId)} />
        </Box>
        <Box paddingRight={3}>
          <Tooltip
            portal
            placement="bottom-end"
            content={t('document-preview.history-unavailable')}
          >
            <Icon
              data-testid="scheduled-draft-history-unavailable"
              muted
              size={1}
              style={{margin: '-0.375rem'}}
              icon={InfoOutlineIcon}
            />
          </Tooltip>
        </Box>
      </Flex>
    </Box>
  )
}
