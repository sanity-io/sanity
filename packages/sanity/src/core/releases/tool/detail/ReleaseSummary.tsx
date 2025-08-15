import {type ReleaseDocument, type SanityDocument} from '@sanity/client'
import {AddIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Card, Container, Stack, useToast} from '@sanity/ui'
import {type RefObject, useCallback, useEffect, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {getVersionId} from '../../../util/draftUtils'
import {getDocumentVariantType} from '../../../util/getDocumentVariantType'
import {AddedVersion} from '../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {Table} from '../components/Table/Table'
import {AddDocumentSearch, type AddedDocument} from './AddDocumentSearch'
import {ReleaseActionBadges} from './components/ReleaseActionBadges'
import {DocumentActions} from './documentTable/DocumentActions'
import {getDocumentTableColumnDefs} from './documentTable/DocumentTableColumnDefs'
import {type DocumentInRelease} from './useBundleDocuments'

export type DocumentInReleaseDetail = DocumentInRelease & {
  // TODO: Get this value from the document, it can be calculated by checking if there is a corresponding document with no version attached
  isAdded?: boolean
}
export type BundleDocumentRow = DocumentInReleaseDetail

export interface ReleaseSummaryProps {
  documents: DocumentInRelease[]
  scrollContainerRef: RefObject<HTMLDivElement | null>
  release: ReleaseDocument
  isLoading?: boolean
}

const isBundleDocumentRow = (
  maybeBundleDocumentRow: unknown,
): maybeBundleDocumentRow is BundleDocumentRow =>
  !!maybeBundleDocumentRow &&
  typeof maybeBundleDocumentRow === 'object' &&
  'memoKey' in maybeBundleDocumentRow &&
  'document' in maybeBundleDocumentRow &&
  'validation' in maybeBundleDocumentRow &&
  'previewValues' in maybeBundleDocumentRow

export function ReleaseSummary(props: ReleaseSummaryProps) {
  const {documents, isLoading = false, release, scrollContainerRef} = props
  const toast = useToast()
  const {createVersion} = useReleaseOperations()
  const telemetry = useTelemetry()

  const [openAddDocumentDialog, setAddDocumentDialog] = useState(false)
  const [pendingAddedDocument, setPendingAddedDocument] = useState<BundleDocumentRow[]>([])

  const {t} = useTranslation(releasesLocaleNamespace)

  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

  const renderRowActions = useCallback(
    (rowProps: {datum: BundleDocumentRow | unknown}) => {
      if (release.state !== 'active') return null
      if (!isBundleDocumentRow(rowProps.datum)) return null
      if (rowProps.datum.isPending) return null

      return <DocumentActions document={rowProps.datum} releaseTitle={release.metadata.title} />
    },
    [release.metadata.title, release.state],
  )

  const documentTableColumnDefs = useMemo(
    () => getDocumentTableColumnDefs(release._id, release.state, t),
    [release._id, release.state, t],
  )

  const handleAddDocumentClick = useCallback(() => setAddDocumentDialog(true), [])

  const filterRows = useCallback(
    (data: DocumentInRelease[], searchTerm: string) =>
      data.filter(({previewValues, isPending}) => {
        const title =
          typeof previewValues.values?.title === 'string'
            ? previewValues.values?.title
            : t('release-placeholder.title')

        // always show the pending rows to visualise that documents are being added
        return isPending || title.toLowerCase().includes(searchTerm.toLowerCase())
      }),
    [t],
  )

  const closeAddDialog = useCallback(
    async (documentToAdd?: AddedDocument) => {
      setAddDocumentDialog(false)
      if (!documentToAdd) return

      const versionDocumentId = getVersionId(documentToAdd._id, releaseId)
      const pendingAddedDocumentId = `${versionDocumentId}-pending`

      const pendingDocumentRow: DocumentInReleaseDetail = {
        memoKey: versionDocumentId,
        previewValues: {isLoading: true, values: {}},
        validation: {
          isValidating: false,
          validation: [],
          hasError: false,
        },
        document: {
          ...(documentToAdd as SanityDocument),
          _id: pendingAddedDocumentId,
          publishedDocumentExists: false,
        },
        isPending: true,
      }

      setPendingAddedDocument((prev) => [...prev, pendingDocumentRow])

      try {
        await createVersion(releaseId, documentToAdd._id)

        const origin = getDocumentVariantType(documentToAdd._id)

        telemetry.log(AddedVersion, {
          documentOrigin: origin,
        })
      } catch (error) {
        setPendingAddedDocument((prev) =>
          prev.filter(({document}) => document._id !== pendingAddedDocumentId),
        )

        toast.push({
          id: `add-version-to-release-${versionDocumentId}`,
          closable: true,
          status: 'error',
          title: t('toast.create-version.error', {error: error.message}),
        })
      }
    },
    [createVersion, releaseId, t, telemetry, toast],
  )

  useEffect(() => {
    const documentsNoLongerPending: string[] = []

    pendingAddedDocument?.forEach((pendingDocument) => {
      // once pending added document has been received by bundle store
      if (
        documents.find(({document}) => `${document._id}-pending` === pendingDocument.document._id)
      ) {
        documentsNoLongerPending.push(pendingDocument.document._id)
      }
    })

    if (documentsNoLongerPending.length)
      // cleanup all resolved added documents
      setPendingAddedDocument((prev) =>
        prev.filter(({document}) => !documentsNoLongerPending.includes(document._id)),
      )
  }, [documents, pendingAddedDocument, t, toast])

  const tableData = useMemo(
    () => (pendingAddedDocument.length ? [...documents, ...pendingAddedDocument] : documents),
    [documents, pendingAddedDocument],
  )

  return (
    <Card
      data-testid="document-table-card"
      ref={scrollContainerRef}
      style={{
        height: '100%',
        overflow: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
      className="hide-scrollbar"
    >
      <Stack>
        <ReleaseActionBadges
          documents={tableData}
          releaseState={release.state}
          isLoading={isLoading}
        />
        <Card borderTop>
          <Table<DocumentInReleaseDetail>
            loading={isLoading}
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
        </Card>
      </Stack>
      {release.state === 'active' && (
        <Container width={3}>
          <Card padding={3}>
            <Button
              icon={AddIcon}
              disabled={isLoading}
              mode="bleed"
              onClick={handleAddDocumentClick}
              text={t('action.add-document')}
            />
          </Card>
        </Container>
      )}
      <AddDocumentSearch
        open={openAddDocumentDialog}
        onClose={closeAddDialog}
        releaseId={releaseId}
        idsInRelease={documents.map(({document}) => document._id)}
      />
    </Card>
  )
}
