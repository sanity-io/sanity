import {type SanityDocument} from '@sanity/client'
import {AddIcon} from '@sanity/icons'
import {Card, Container} from '@sanity/ui'
import {type RefObject, useCallback, useEffect, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../store/types'
import {Table} from '../components/Table/Table'
import {AddDocumentSearch, type AddedDocument} from './AddDocumentSearch'
import {DocumentActions} from './documentTable/DocumentActions'
import {getDocumentTableColumnDefs} from './documentTable/DocumentTableColumnDefs'
import {type DocumentHistory} from './documentTable/useReleaseHistory'
import {type DocumentInRelease} from './useBundleDocuments'

export type DocumentWithHistory = DocumentInRelease & {
  history: DocumentHistory | undefined
  // TODO: Get this value from the document, it can be calculated by checking if there is a corresponding document with no version attached
  isAdded?: boolean
}
export type BundleDocumentRow = DocumentWithHistory

export interface ReleaseSummaryProps {
  documents: DocumentInRelease[]
  documentsHistory: Record<string, DocumentHistory>
  scrollContainerRef: RefObject<HTMLDivElement | null>
  release: ReleaseDocument
}

const isBundleDocumentRow = (
  maybeBundleDocumentRow: unknown,
): maybeBundleDocumentRow is BundleDocumentRow =>
  !!maybeBundleDocumentRow &&
  typeof maybeBundleDocumentRow === 'object' &&
  'memoKey' in maybeBundleDocumentRow &&
  'document' in maybeBundleDocumentRow &&
  'validation' in maybeBundleDocumentRow &&
  'previewValues' in maybeBundleDocumentRow &&
  'history' in maybeBundleDocumentRow

export function ReleaseSummary(props: ReleaseSummaryProps) {
  const {documents, documentsHistory, release, scrollContainerRef} = props
  const [openAddDocumentDialog, setAddDocumentDialog] = useState(false)
  const [pendingAddedDocument, setPendingAddedDocument] = useState<BundleDocumentRow | null>(null)

  const {t} = useTranslation(releasesLocaleNamespace)

  const aggregatedData = useMemo(
    () =>
      documents.map((document) => ({
        ...document,
        history: documentsHistory[document.document._id],
      })),
    [documents, documentsHistory],
  )

  const renderRowActions = useCallback(
    (rowProps: {datum: BundleDocumentRow | unknown}) => {
      if (release.state !== 'active') return null
      if (!isBundleDocumentRow(rowProps.datum)) return null
      if (pendingAddedDocument?.document._id === rowProps.datum.document._id) return null

      return <DocumentActions document={rowProps.datum} releaseTitle={release.metadata.title} />
    },
    [pendingAddedDocument, release.metadata.title, release.state],
  )

  const documentTableColumnDefs = useMemo(
    () => getDocumentTableColumnDefs(release._id, release.state, t),
    [release._id, release.state, t],
  )

  const filterRows = useCallback(
    (data: DocumentWithHistory[], searchTerm: string) =>
      data.filter(({document, previewValues}) => {
        const title =
          typeof previewValues.values.title === 'string'
            ? previewValues.values.title
            : t('release-placeholder.title')

        return document.isPending || title.toLowerCase().includes(searchTerm.toLowerCase())
      }),
    [t],
  )

  const closeAddDialog = useCallback((documentToAdd: AddedDocument) => {
    setAddDocumentDialog(false)
    setPendingAddedDocument({
      memoKey: documentToAdd._id,
      previewValues: {isLoading: true, values: {}},
      validation: {
        isValidating: false,
        validation: [],
        hasError: false,
      },
      history: undefined,
      document: {...(documentToAdd as SanityDocument), publishedDocumentExists: false},
      isPending: true,
    })
  }, [])

  // Remove pending added document once it has been received by bundle store
  useEffect(() => {
    if (
      pendingAddedDocument &&
      documents.some(({document}) => document._id === pendingAddedDocument.document._id)
    ) {
      setPendingAddedDocument(null)
    }
  }, [pendingAddedDocument, documents])

  const tableData = useMemo(
    () => (pendingAddedDocument ? [...aggregatedData, pendingAddedDocument] : aggregatedData),
    [pendingAddedDocument, aggregatedData],
  )

  return (
    <Card borderTop data-testid="document-table-card" ref={scrollContainerRef}>
      <Table<DocumentWithHistory>
        data={tableData}
        emptyState={t('summary.no-documents')}
        // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
        rowId="document._id"
        columnDefs={documentTableColumnDefs}
        rowActions={renderRowActions}
        searchFilter={filterRows}
        scrollContainerRef={scrollContainerRef}
        defaultSort={{column: 'search', direction: 'asc'}}
      />
      {release.state === 'active' && (
        <Container width={3}>
          <Card padding={3}>
            <Button
              icon={AddIcon}
              mode="bleed"
              onClick={() => setAddDocumentDialog(true)}
              // @todo support adding multiple documents quickly
              // before each has been received in store
              disabled={!!pendingAddedDocument}
              text={t('action.add-document')}
            />
          </Card>
        </Container>
      )}
      <AddDocumentSearch
        open={openAddDocumentDialog}
        onClose={closeAddDialog}
        releaseDocumentId={release._id}
      />
    </Card>
  )
}
