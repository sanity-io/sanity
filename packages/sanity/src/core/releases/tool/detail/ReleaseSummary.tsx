import {type ReleaseDocument, type SanityDocument} from '@sanity/client'
import {AddIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Card, Container, Stack, useToast} from '@sanity/ui'
import {type RefObject, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {DEFAULT_ORDERING} from '../../../search/search-document-list/constants'
import {useDocumentList} from '../../../search/search-document-list/useDocumentList'
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
import {type DocumentInRelease, useBundleDocuments} from './useBundleDocuments'

export type DocumentInReleaseDetail = DocumentInRelease & {
  // TODO: Get this value from the document, it can be calculated by checking if there is a corresponding document with no version attached
  isAdded?: boolean
}
export type BundleDocumentRow = Partial<SanityDocument>

export interface ReleaseSummaryProps {
  documents: Partial<SanityDocument>[]
  scrollContainerRef: RefObject<HTMLDivElement | null>
  release: ReleaseDocument
  isLoading?: boolean
}

const isBundleDocumentRow = (
  maybeBundleDocumentRow: unknown,
): maybeBundleDocumentRow is BundleDocumentRow =>
  !!maybeBundleDocumentRow &&
  typeof maybeBundleDocumentRow === 'object' &&
  'document' in maybeBundleDocumentRow &&
  'validation' in maybeBundleDocumentRow

export function ReleaseSummary(props: ReleaseSummaryProps) {
  const {documents, isLoading = false, release, scrollContainerRef} = props
  const toast = useToast()
  const {createVersion} = useReleaseOperations()
  const telemetry = useTelemetry()

  const [openAddDocumentDialog, setAddDocumentDialog] = useState(false)
  const [pendingAddedDocument, setPendingAddedDocument] = useState<BundleDocumentRow[]>([])

  const {results: allDocuments} = useBundleDocuments(release._id)

  //console.log(documents)
  //console.log(allDocuments)

  const {t} = useTranslation(releasesLocaleNamespace)

  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

  const [searchTerm, setSearchTerm] = useState('')
  const searchTermRef = useRef(searchTerm)

  // Update ref when searchTerm changes
  useEffect(() => {
    searchTermRef.current = searchTerm
  }, [searchTerm])

  const {items} = useDocumentList({
    apiVersion: '2025-08-28',
    filter: 'sanity::partOfRelease($releaseId)',
    perspective: [releaseId],
    searchQuery: searchTerm,
    sortOrder: DEFAULT_ORDERING,
    params: {releaseId},
  })

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
    (data: DocumentInRelease[], st: string) => {
      console.warn('in search')

      // Update search term without causing infinite loop
      if (searchTermRef.current !== st) {
        setSearchTerm(st)
      }

      return items.map((item) => ({
        ...item,
        document: {
          ...item,
          _id: item._id,
          _type: item._type,
          _updatedAt: item._updatedAt,
          _rev: item._rev,
          _system: item._system,
          publishedDocumentExists: item.publishedDocumentExists,
        },
        validation: {
          isValidating: false,
          validation: [],
          hasError: false,
        },
        isPending: false,
        isAdded: false,
      })) as DocumentInReleaseDetail[]
    },
    [items],
  )

  const closeAddDialog = useCallback(
    async (documentToAdd?: AddedDocument) => {
      setAddDocumentDialog(false)
      if (!documentToAdd) return

      const versionDocumentId = getVersionId(documentToAdd._id, releaseId)
      const pendingAddedDocumentId = `${versionDocumentId}-pending`

      const pendingDocumentRow: DocumentInReleaseDetail = {
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

  //console.log(documents)
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
          <Table<Partial<SanityDocument>>
            loading={isLoading}
            data={tableData}
            emptyState={t('summary.no-documents')}
            // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
            rowId="document._id"
            columnDefs={documentTableColumnDefs}
            rowActions={renderRowActions}
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
        idsInRelease={documents.map(({_id}) => _id as string)}
      />
      )
    </Card>
  )
}
