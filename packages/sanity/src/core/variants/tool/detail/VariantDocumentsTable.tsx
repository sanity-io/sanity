import {Box, Card, Flex} from '@sanity/ui'
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
}

function filterDocuments(
  rows: DocumentInVariantGroup[],
  searchTerm: string,
): DocumentInVariantGroup[] {
  if (!searchTerm.trim()) {
    return rows
  }

  return rows.filter(({document}) => searchDocumentRelease(document, searchTerm))
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
  const columnDefs = useMemo<Column<DocumentInVariantGroup>[]>(
    () => getVariantDocumentTableColumnDefs(t, variantId, releasesById),
    [t, variantId, releasesById],
  )

  const segments = useMemo(
    () => computeReleaseLaneSegments(rows, releasesById),
    [rows, releasesById],
  )

  const laneFilteredRows = useMemo(() => {
    if (activeLane === RELEASE_LANE_ALL) {
      return rows
    }
    return rows.filter((row) => rowMatchesLane(row, activeLane, releasesById))
  }, [rows, activeLane, releasesById])

  // If the active release lane disappears (e.g. its documents move), fall back to "All".
  const resolvedActiveLane =
    activeLane === RELEASE_LANE_ALL || segments.some((segment) => segment.id === activeLane)
      ? activeLane
      : RELEASE_LANE_ALL

  const handleSelectLane = useCallback((laneId: string) => {
    // Clicking the already-active segment clears the filter back to "All".
    setActiveLane((previous) => (previous === laneId ? RELEASE_LANE_ALL : laneId))
  }, [])

  return (
    <Flex direction="column" flex={1} height="fill" overflow="hidden" style={{minHeight: 0}}>
      {!loading && segments.length > 1 && (
        <Box flex="none" paddingTop={4} paddingX={4}>
          <VariantReleaseLane
            activeLane={resolvedActiveLane}
            onSelectLane={handleSelectLane}
            segments={segments}
            totalCount={rows.length}
          />
        </Box>
      )}
      <Card
        flex={1}
        id="variant-documents-table"
        ref={setScrollContainerRef}
        style={TABLE_CARD_STYLE}
      >
        <Table<DocumentInVariantGroup>
          columnDefs={columnDefs}
          data={laneFilteredRows}
          defaultSort={{column: 'documentGroup', direction: 'asc'}}
          emptyState={t('detail.documents.no-documents')}
          loading={loading}
          // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
          rowId="groupId"
          scrollContainerRef={scrollContainerRef}
          searchFilter={filterDocuments}
        />
      </Card>
    </Flex>
  )
}
