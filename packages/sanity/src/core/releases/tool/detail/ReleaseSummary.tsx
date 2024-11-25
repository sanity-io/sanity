import {AddIcon} from '@sanity/icons'
import {Card, Container} from '@sanity/ui'
import {type RefObject, useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../store/types'
import {Table} from '../components/Table/Table'
import {AddDocumentSearch} from './AddDocumentSearch'
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
  scrollContainerRef: RefObject<HTMLDivElement>
  release: ReleaseDocument
}

export function ReleaseSummary(props: ReleaseSummaryProps) {
  const {documents, documentsHistory, release, scrollContainerRef} = props
  const [openAddDocumentDialog, setAddDocumentDialog] = useState(false)

  const {t} = useTranslation(releasesLocaleNamespace)

  const aggregatedData = useMemo(
    () =>
      documents.map((document) => ({
        ...document,
        history: documentsHistory[document.document._id],
      })),
    [documents, documentsHistory],
  )

  const renderRowActions: ({datum}: {datum: BundleDocumentRow | unknown}) => JSX.Element =
    useCallback(
      ({datum}) => {
        const document = datum as BundleDocumentRow

        return <DocumentActions document={document} releaseTitle={release.metadata.title} />
      },
      [release.metadata.title],
    )

  const documentTableColumnDefs = useMemo(
    () => getDocumentTableColumnDefs(release._id, t),
    [release._id, t],
  )

  const filterRows = useCallback(
    (data: DocumentWithHistory[], searchTerm: string) =>
      data.filter(({previewValues}) => {
        const title =
          typeof previewValues.values.title === 'string' ? previewValues.values.title : 'Untitled'
        return title.toLowerCase().includes(searchTerm.toLowerCase())
      }),
    [],
  )

  const closeAddDialog = useCallback(() => {
    setAddDocumentDialog(false)
  }, [])

  return (
    <Card borderTop data-testid="document-table-card" ref={scrollContainerRef}>
      <Table<DocumentWithHistory>
        data={aggregatedData}
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
              padding={2}
              text={t('action.add-document')}
            />
          </Card>
        </Container>
      )}
      <AddDocumentSearch
        open={openAddDocumentDialog}
        onClose={closeAddDialog}
        releaseId={release._id}
      />
    </Card>
  )
}
