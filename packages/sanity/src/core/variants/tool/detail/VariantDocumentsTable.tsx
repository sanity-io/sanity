import {useCallback, useMemo, useState} from 'react'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {DocumentTable} from '../../../releases/tool/components/Table/DocumentTable'
import {type Column} from '../../../releases/tool/components/Table/types'
import {searchDocumentRelease} from '../../../releases/tool/detail/documentTable/searchDocumentRelease'
import {variantsLocaleNamespace} from '../../i18n'
import {computeReleaseLaneSegments, RELEASE_LANE_ALL, rowMatchesLane} from './releaseLane'
import {type DocumentInVariantGroup} from './types'
import {VariantDocumentActions} from './variantDocumentTable/VariantDocumentActions'
import {getVariantDocumentTableColumnDefs} from './variantDocumentTable/VariantDocumentTableColumnDefs'
import {VariantReleaseLane} from './VariantReleaseLane'

function searchVariantDocument(row: DocumentInVariantGroup, searchTerm: string): boolean {
  return searchDocumentRelease(row.document, searchTerm)
}

export function VariantDocumentsTable({
  rows,
  loading = false,
  variantId,
}: {
  rows: DocumentInVariantGroup[]
  loading?: boolean
  variantId?: string
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const [activeLane, setActiveLane] = useState<string>(RELEASE_LANE_ALL)
  const {byId: releasesById} = useActiveReleases()

  const segments = useMemo(
    () => computeReleaseLaneSegments(rows, releasesById),
    [rows, releasesById],
  )

  const activeLaneIsValid =
    activeLane === RELEASE_LANE_ALL || segments.some((segment) => segment.id === activeLane)

  // If the active release lane disappears (e.g. its documents move), fall back to "All" and
  // clear state so a later reappearance of that bundle does not resurrect the stale filter.
  if (!activeLaneIsValid) {
    setActiveLane(RELEASE_LANE_ALL)
  }

  const resolvedActiveLane = activeLaneIsValid ? activeLane : RELEASE_LANE_ALL

  // Filter tabs are the one way to scope by bundle (grouping was removed: filtering preserves
  // column sorting, which grouping cannot). A selected tab filters the flat, always-sortable list;
  // the shared DocumentTable applies free-text search on top of these lane-filtered rows.
  const laneRows = useMemo(() => {
    const filtered =
      resolvedActiveLane === RELEASE_LANE_ALL
        ? rows
        : rows.filter((row) => rowMatchesLane(row, resolvedActiveLane, releasesById))
    return filtered.map((row) => ({...row, rowKey: row.groupId}))
  }, [rows, resolvedActiveLane, releasesById])

  const handleSelectLane = useCallback((laneId: string) => {
    // Clicking the already-active segment clears the filter back to "All".
    setActiveLane((previous) => (previous === laneId ? RELEASE_LANE_ALL : laneId))
  }, [])

  const renderRowActions = useCallback(
    ({datum}: {datum: unknown}) => (
      <VariantDocumentActions row={datum as DocumentInVariantGroup} t={t} />
    ),
    [t],
  )

  const hasReleaseControls = !loading && rows.length > 0 && segments.length > 1

  const columnDefs = useMemo<Column<DocumentInVariantGroup>[]>(
    () => getVariantDocumentTableColumnDefs(t, variantId, releasesById),
    [t, variantId, releasesById],
  )

  return (
    <DocumentTable<DocumentInVariantGroup>
      // Keep the command lane (search + filter tabs) mounted during load so it doesn't pop in when
      // rows arrive — matching the release detail table and avoiding a layout jump.
      alwaysShowCommandLane
      columnDefs={columnDefs}
      defaultSort={{column: 'documentGroup', direction: 'asc'}}
      emptyState={t('detail.documents.no-documents')}
      filterTabs={
        hasReleaseControls ? (
          <VariantReleaseLane
            activeLane={resolvedActiveLane}
            onSelectLane={handleSelectLane}
            segments={segments}
            totalCount={rows.length}
          />
        ) : undefined
      }
      getRowKey={(row) => row.groupId}
      id="variant-documents-table"
      loading={loading}
      rowActions={renderRowActions}
      rows={laneRows}
      // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
      rowId="rowKey"
      searchPlaceholder={t('detail.documents.table.search-placeholder')}
      searchPredicate={searchVariantDocument}
      searchTestId="variant-documents-search"
    />
  )
}
