import {Box, Card, Container, Flex} from '@sanity/ui'
import {type CSSProperties, useCallback, useMemo, useState} from 'react'

import {useTranslation} from '../../../i18n'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {Table} from '../../../releases/tool/components/Table/Table'
import {type Column} from '../../../releases/tool/components/Table/types'
import {searchDocumentRelease} from '../../../releases/tool/detail/documentTable/searchDocumentRelease'
import {variantsLocaleNamespace} from '../../i18n'
import {computeReleaseLaneSegments, RELEASE_LANE_ALL, rowMatchesLane} from './releaseLane'
import {type DocumentInVariantGroup} from './types'
import {getVariantDocumentTableColumnDefs} from './variantDocumentTable/VariantDocumentTableColumnDefs'
import {VariantReleaseLane} from './VariantReleaseLane'

const TABLE_CARD_STYLE: CSSProperties = {
  height: '100%',
  overflow: 'auto',
  // Reserve the vertical scrollbar gutter permanently. The shared Table centers its rows in a
  // fixed-width Container, so when a filter (e.g. All → Published) drops the row count below the
  // overflow threshold, the scrollbar vanishes, the content box widens, and the centered table
  // jumps horizontally. A stable gutter keeps the content-box width constant across filters.
  scrollbarGutter: 'stable',
}

function filterDocuments(
  rows: DocumentInVariantGroup[],
  searchTerm: string,
): DocumentInVariantGroup[] {
  if (!searchTerm.trim()) {
    return rows
  }

  return rows.filter((row) => searchDocumentRelease(row.document, searchTerm))
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
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)
  const [activeLane, setActiveLane] = useState<string>(RELEASE_LANE_ALL)
  const {data: releases} = useActiveReleases()
  const releasesById = useMemo(
    () => new Map(releases.map((release) => [release._id, release])),
    [releases],
  )

  const segments = useMemo(
    () => computeReleaseLaneSegments(rows, releasesById),
    [rows, releasesById],
  )

  // If the active release lane disappears (e.g. its documents move), fall back to "All".
  const resolvedActiveLane =
    activeLane === RELEASE_LANE_ALL || segments.some((segment) => segment.id === activeLane)
      ? activeLane
      : RELEASE_LANE_ALL

  // Filter tabs are the one way to scope by bundle (grouping was removed: filtering preserves
  // column sorting, which grouping cannot). A selected tab filters the flat, always-sortable list.
  const displayRows = useMemo(() => {
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

  const hasReleaseControls = !loading && segments.length > 1

  const columnDefs = useMemo<Column<DocumentInVariantGroup>[]>(
    () => getVariantDocumentTableColumnDefs(t, variantId, releasesById),
    [t, variantId, releasesById],
  )

  return (
    <Flex direction="column" flex={1} height="fill" overflow="hidden" style={{minHeight: 0}}>
      {hasReleaseControls && (
        // Bordered so the filter lane is visually distinct from the table's column-header row below.
        <Card flex="none" borderBottom paddingY={3}>
          {/* container[3] chrome so the lane aligns with the table's row content (which the shared
              Table centers at container[3]); the inner box still scrolls if the tabs overflow. */}
          <Container flex="none" width={3}>
            <Box paddingX={3} style={{minWidth: 0, overflowX: 'auto'}}>
              <VariantReleaseLane
                activeLane={resolvedActiveLane}
                onSelectLane={handleSelectLane}
                segments={segments}
                totalCount={rows.length}
              />
            </Box>
          </Container>
        </Card>
      )}
      {/* Full-width scroll region so the table borders span the pane; the shared Table centers its
          rows at container[3], matching the chrome above. */}
      <Card
        flex={1}
        id="variant-documents-table"
        ref={setScrollContainerRef}
        style={TABLE_CARD_STYLE}
      >
        <Table<DocumentInVariantGroup>
          columnDefs={columnDefs}
          data={displayRows}
          defaultSort={{column: 'documentGroup', direction: 'asc'}}
          emptyState={t('detail.documents.no-documents')}
          loading={loading}
          // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
          rowId="rowKey"
          scrollContainerRef={scrollContainerRef}
          searchFilter={filterDocuments}
        />
      </Card>
    </Flex>
  )
}
