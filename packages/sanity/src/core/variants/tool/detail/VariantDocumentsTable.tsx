import {StackIcon} from '@sanity/icons/Stack'
import {Box, Card, Flex} from '@sanity/ui'
import {type CSSProperties, useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {Table} from '../../../releases/tool/components/Table/Table'
import {type Column} from '../../../releases/tool/components/Table/types'
import {searchDocumentRelease} from '../../../releases/tool/detail/documentTable/searchDocumentRelease'
import {variantsLocaleNamespace} from '../../i18n'
import {
  buildReleaseSwimlaneRows,
  computeReleaseLaneSegments,
  RELEASE_LANE_ALL,
  type ReleaseLaneSegment,
  rowMatchesLane,
} from './releaseLane'
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

  // Keep release aggregate headers so the swimlane structure survives a search.
  return rows.filter(
    (row) => row.isReleaseAggregate || searchDocumentRelease(row.document, searchTerm),
  )
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
  // Bundle labels live in the core namespace (shared with the per-row bundle chips / lane).
  const {t: tCore} = useTranslation()
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)
  const [activeLane, setActiveLane] = useState<string>(RELEASE_LANE_ALL)
  const [grouped, setGrouped] = useState(false)
  const [expandedReleases, setExpandedReleases] = useState<ReadonlySet<string>>(() => new Set())
  const {data: releases} = useActiveReleases()
  const releasesById = useMemo(
    () => new Map(releases.map((release) => [release._id, release])),
    [releases],
  )
  const columnDefs = useMemo<Column<DocumentInVariantGroup>[]>(
    () => getVariantDocumentTableColumnDefs(t, variantId, releasesById, grouped),
    [t, variantId, releasesById, grouped],
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

  const getSegmentLabel = useCallback(
    (segment: ReleaseLaneSegment): string => {
      if (segment.kind === 'published') return tCore('release.chip.published')
      if (segment.kind === 'drafts') return tCore('release.chip.draft')
      return segment.release?.metadata?.title ?? tCore('release.placeholder-untitled-release')
    },
    [tCore],
  )

  const toggleRelease = useCallback((segmentId: string) => {
    setExpandedReleases((previous) => {
      const next = new Set(previous)
      if (next.has(segmentId)) {
        next.delete(segmentId)
      } else {
        next.add(segmentId)
      }
      return next
    })
  }, [])

  const swimlaneRows = useMemo(
    () =>
      buildReleaseSwimlaneRows({
        rows,
        releasesById,
        expanded: expandedReleases,
        getSegmentLabel,
        onToggle: toggleRelease,
      }),
    [rows, releasesById, expandedReleases, getSegmentLabel, toggleRelease],
  )

  // If the active release lane disappears (e.g. its documents move), fall back to "All".
  const resolvedActiveLane =
    activeLane === RELEASE_LANE_ALL || segments.some((segment) => segment.id === activeLane)
      ? activeLane
      : RELEASE_LANE_ALL

  const handleSelectLane = useCallback((laneId: string) => {
    // Clicking the already-active segment clears the filter back to "All".
    setActiveLane((previous) => (previous === laneId ? RELEASE_LANE_ALL : laneId))
  }, [])

  const displayRows = grouped ? swimlaneRows : laneFilteredRows
  const hasReleaseControls = !loading && segments.length > 1

  return (
    <Flex direction="column" flex={1} height="fill" overflow="hidden" style={{minHeight: 0}}>
      {hasReleaseControls && (
        <Box flex="none" paddingTop={4} paddingX={4}>
          {/* Toggle sits in its own fixed top-right row so it never shifts when the filter
              lane below it appears/disappears. */}
          <Flex justify="flex-end">
            <Button
              data-testid="variant-group-by-release-toggle"
              icon={StackIcon}
              mode={grouped ? 'default' : 'ghost'}
              onClick={() => setGrouped((previous) => !previous)}
              selected={grouped}
              text={t('detail.release-lane.group-by-release')}
            />
          </Flex>
          {!grouped && (
            <Box paddingTop={3}>
              <VariantReleaseLane
                activeLane={resolvedActiveLane}
                onSelectLane={handleSelectLane}
                segments={segments}
                totalCount={rows.length}
              />
            </Box>
          )}
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
          data={displayRows}
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
