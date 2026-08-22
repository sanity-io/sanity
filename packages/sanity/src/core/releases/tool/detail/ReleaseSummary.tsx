import {type ReleaseDocument, type SanityDocument} from '@sanity/client'
import {AddIcon} from '@sanity/icons/Add'
import {useTelemetry} from '@sanity/telemetry/react'
import {Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type CSSProperties, useCallback, useEffect, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {getDocumentVersionType} from '../../../config/document/useConfiguredDocumentActionIds'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../../studio/workspace'
import {getVersionId} from '../../../util/draftUtils'
import {getDocumentVariantType} from '../../../util/getDocumentVariantType'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
import {useAllVariants} from '../../../variants/store/useAllVariants'
import {AddedVersion} from '../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {DocumentTable} from '../components/Table/DocumentTable'
import {Table} from '../components/Table/Table'
import {AddDocumentSearch, type AddedDocument} from './AddDocumentSearch'
import {ReleaseDocumentFilterTabs} from './components/ReleaseDocumentFilterTabs'
import {DocumentActions} from './documentTable/DocumentActions'
import {getDocumentTableColumnDefs} from './documentTable/DocumentTableColumnDefs'
import {searchDocumentRelease} from './documentTable/searchDocumentRelease'
import {type DocumentFilterType, documentMatchesFilter} from './releaseDocumentActions'
import {type DocumentInRelease} from './types'

export type DocumentInReleaseDetail = DocumentInRelease & {
  // TODO: Get this value from the document, it can be calculated by checking if there is a corresponding document with no version attached
  isAdded?: boolean
}
export type BundleDocumentRow = DocumentInReleaseDetail

export interface ReleaseSummaryProps {
  documents: DocumentInRelease[]
  release: ReleaseDocument
  isLoading?: boolean
}

const FULL_HEIGHT_STYLE: CSSProperties = {height: '100%'}

const SCROLL_CONTAINER_STYLE: CSSProperties = {
  overflow: 'auto',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
}

const FIT_CONTENT_STYLE: CSSProperties = {minWidth: 'fit-content', height: '100%'}

const isBundleDocumentRow = (
  maybeBundleDocumentRow: unknown,
): maybeBundleDocumentRow is BundleDocumentRow =>
  !!maybeBundleDocumentRow &&
  typeof maybeBundleDocumentRow === 'object' &&
  'memoKey' in maybeBundleDocumentRow &&
  'document' in maybeBundleDocumentRow &&
  'validation' in maybeBundleDocumentRow

export function ReleaseSummary(props: ReleaseSummaryProps) {
  const {documents, isLoading = false, release} = props
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)
  const toast = useToast()
  const {createVersion} = useReleaseOperations()
  const telemetry = useTelemetry()

  const [openAddDocumentDialog, setAddDocumentDialog] = useState(false)
  const [pendingAddedDocument, setPendingAddedDocument] = useState<BundleDocumentRow[]>([])
  const [activeFilter, setActiveFilter] = useState<DocumentFilterType>('all')

  const {t} = useTranslation(releasesLocaleNamespace)

  // Behind beta.variants: adopt the shared three-zone DocumentTable (command-lane search + filter
  // tabs). Otherwise keep the current table (search in the column header). No user-facing change to
  // production Releases until the flag is on.
  const {beta} = useWorkspace()
  const variantsEnabled = Boolean(beta?.variants?.enabled)
  // Resolves each document's variant (via `_system.variant._ref`) to its definition for the
  // "Variant" column. Provider-free + cached; returns empty when variants are disabled.
  const {byId: variantsById, loading: variantsLoading} = useAllVariants()

  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

  const isCardinalityOne = isCardinalityOneRelease(release)

  // Rows of a cardinality-one release are scheduled drafts, and that plugin resolves a different
  // action list, so the row menu has to ask about the same version type the footer does.
  const rowVersionType = getDocumentVersionType({
    isScheduledDraft: isCardinalityOne,
    isVersionDocument: true,
  })

  const renderRowActions = useCallback(
    (rowProps: {datum: BundleDocumentRow | unknown}) => {
      if (release.state !== 'active') return null
      if (!isBundleDocumentRow(rowProps.datum)) return null
      if (rowProps.datum.isPending) return null

      return (
        <DocumentActions
          document={rowProps.datum}
          releaseTitle={release.metadata.title}
          versionType={rowVersionType}
        />
      )
    },
    [release.metadata.title, release.state, rowVersionType],
  )

  const documentTableColumnDefs = useMemo(
    () =>
      getDocumentTableColumnDefs(release._id, release.state, t, {
        searchInCommandLane: variantsEnabled,
        variantsById: variantsEnabled ? variantsById : undefined,
        variantsLoading: variantsEnabled ? variantsLoading : false,
        variantsEnabled,
      }),
    [release._id, release.state, t, variantsEnabled, variantsById, variantsLoading],
  )

  const handleAddDocumentClick = useCallback(() => setAddDocumentDialog(true), [])

  const filterRows = useCallback(
    (data: DocumentInRelease[], searchTerm: string) => {
      // this is a temporary way of doing the search without the previews
      // until we have it moved to the server side
      return data.filter((doc) => {
        const matchesSearch = searchTerm ? searchDocumentRelease(doc.document, searchTerm) : true
        return matchesSearch && documentMatchesFilter(doc, activeFilter)
      })
    },
    [activeFilter],
  )

  const closeAddDialog = useCallback(
    async (documentToAdd?: AddedDocument) => {
      setAddDocumentDialog(false)
      if (!documentToAdd) return

      const versionDocumentId = getVersionId(documentToAdd._id, releaseId)
      const pendingAddedDocumentId = `${versionDocumentId}-pending`

      const pendingDocumentRow: DocumentInReleaseDetail = {
        memoKey: versionDocumentId,
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
      // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
      setPendingAddedDocument((prev) =>
        prev.filter(({document}) => !documentsNoLongerPending.includes(document._id)),
      )
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
  }, [documents, pendingAddedDocument, t, toast])

  const tableData = useMemo(
    () => (pendingAddedDocument.length ? [...documents, ...pendingAddedDocument] : documents),
    [documents, pendingAddedDocument],
  )

  // In the DocumentTable (variants-enabled) shape, free-text search is owned by the table; the
  // caller pre-filters by the active tab and passes those rows in.
  const filterTabRows = useMemo(
    () => tableData.filter((doc) => documentMatchesFilter(doc, activeFilter)),
    [tableData, activeFilter],
  )

  const hasNoDocuments = !isLoading && documents.length === 0

  if (isCardinalityOne && hasNoDocuments) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        padding={5}
        style={FULL_HEIGHT_STYLE}
        data-testid="cardinality-one-empty-state"
      >
        <Stack gap={3} style={{textAlign: 'center', maxWidth: '300px'}}>
          <Text size={1} weight="semibold">
            {t('summary.no-documents-cardinality-one.title')}
          </Text>
          <Text size={1} muted>
            {t('summary.no-documents-cardinality-one.description')}
          </Text>
        </Stack>
      </Flex>
    )
  }

  // Old (non-variant) path: Add-document lives at the end of the list.
  const addDocumentFooter = release.state === 'active' && (
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
  )

  // New (DocumentTable) path: one action lane. Activity + Share (icons) sit alongside Add document
  // (the labeled primary), so every "do something" control lives together at the right of the lane
  // instead of being scattered into the header.
  const addDocumentButton = release.state === 'active' && (
    <Button
      disabled={isLoading}
      icon={AddIcon}
      mode="ghost"
      onClick={handleAddDocumentClick}
      text={t('action.add-document')}
    />
  )
  // The command lane hosts table operations only (Add document + search). Release-level actions
  // (Copy, Activity) live in the always-rendered header so they stay reachable when the table is
  // loading, errored, or an empty cardinality-one release and this lane is not mounted.
  const commandLaneActions = addDocumentButton || undefined

  // ReleaseDocumentFilterTabs renders nothing for archived/published releases or an empty
  // (non-loading) document set. Passing the element unconditionally would still read as "tabs
  // present" to DocumentTable, pinning search to a fixed width and stranding an empty left gutter.
  // Gate it here so the table falls back to a full-width search lane when there are no tabs to show.
  const showFilterTabs =
    release.state !== 'archived' &&
    release.state !== 'published' &&
    (isLoading || tableData.length > 0)

  return (
    <Flex direction="column" style={FULL_HEIGHT_STYLE}>
      {variantsEnabled ? (
        <DocumentTable<DocumentInReleaseDetail>
          alwaysShowCommandLane
          columnDefs={documentTableColumnDefs}
          defaultSort={{column: 'search', direction: 'asc'}}
          emptyState={t('summary.no-documents')}
          commandLaneActions={commandLaneActions}
          filterTabs={
            showFilterTabs ? (
              <ReleaseDocumentFilterTabs
                activeFilter={activeFilter}
                documents={tableData}
                inline
                isLoading={isLoading}
                onFilterChange={setActiveFilter}
                releaseState={release.state}
              />
            ) : undefined
          }
          getRowKey={(row) => row.document._id}
          id="document-table-card"
          loading={isLoading}
          rowActions={renderRowActions}
          rows={filterTabRows}
          // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
          rowId="document._id"
          searchPlaceholder={t('search-documents-placeholder')}
          searchPredicate={(row, searchTerm) => searchDocumentRelease(row.document, searchTerm)}
          searchTestId="release-documents-search"
        />
      ) : (
        <>
          <ReleaseDocumentFilterTabs
            documents={tableData}
            releaseState={release.state}
            isLoading={isLoading}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
          <Card
            ref={setScrollContainerRef}
            data-testid="document-table-card"
            flex={1}
            borderTop
            style={SCROLL_CONTAINER_STYLE}
          >
            <div style={FIT_CONTENT_STYLE}>
              <Table<DocumentInReleaseDetail>
                loading={isLoading}
                data={tableData}
                emptyState={t('summary.no-documents')}
                // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
                rowId="document._id"
                columnDefs={documentTableColumnDefs}
                rowActions={renderRowActions}
                searchFilter={filterRows}
                scrollContainerRef={scrollContainerRef}
                defaultSort={{column: 'search', direction: 'asc'}}
              />
            </div>
          </Card>
          {addDocumentFooter}
        </>
      )}
      <AddDocumentSearch
        open={openAddDocumentDialog}
        onClose={closeAddDialog}
        releaseId={releaseId}
        idsInRelease={documents.map(({document}) => document._id)}
      />
    </Flex>
  )
}
