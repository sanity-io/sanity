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

  // If the active release lane disappears (e.g. its documents move), fall back to "All".
  const resolvedActiveLane =
    activeLane === RELEASE_LANE_ALL || segments.some((segment) => segment.id === activeLane)
      ? activeLane
      : RELEASE_LANE_ALL

  const flatRows = useMemo(() => {
    const filtered =
      resolvedActiveLane === RELEASE_LANE_ALL
        ? rows
        : rows.filter((row) => rowMatchesLane(row, resolvedActiveLane, releasesById))
    // The flat view keys rows by their real groupId.
    return filtered.map((row) => ({...row, rowKey: row.groupId}))
  }, [rows, resolvedActiveLane, releasesById])

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
        activeLane: resolvedActiveLane,
        getSegmentLabel,
        onToggle: toggleRelease,
      }),
    [rows, releasesById, expandedReleases, resolvedActiveLane, getSegmentLabel, toggleRelease],
  )

  const handleSelectLane = useCallback((laneId: string) => {
    // Clicking the already-active segment clears the filter back to "All".
    setActiveLane((previous) => (previous === laneId ? RELEASE_LANE_ALL : laneId))
  }, [])

  const handleToggleGrouped = useCallback(() => {
    const next = !grouped
    setGrouped(next)
    // Open every group by default so grouping just inserts headers rather than collapsing content.
    if (next) {
      setExpandedReleases(new Set(segments.map((segment) => segment.id)))
    }
  }, [grouped, segments])

  const displayRows = grouped ? swimlaneRows : flatRows
  const hasReleaseControls = !loading && segments.length > 1

  return (
    <Flex direction="column" flex={1} height="fill" overflow="hidden" style={{minHeight: 0}}>
      {hasReleaseControls && (
        <Box flex="none" paddingTop={4} paddingX={4}>
          {/* One persistent lane: the filter tabs always filter; the toggle only switches the
              list/grouped view. Nothing is conditionally hidden, so the toggle never shifts. */}
          <Flex align="center" gap={3} justify="space-between">
            <Box flex={1} style={{minWidth: 0, overflowX: 'auto'}}>
              <VariantReleaseLane
                activeLane={resolvedActiveLane}
                onSelectLane={handleSelectLane}
                segments={segments}
                totalCount={rows.length}
              />
            </Box>
            <Button
              data-testid="variant-group-by-release-toggle"
              icon={StackIcon}
              mode="bleed"
              onClick={handleToggleGrouped}
              selected={grouped}
              tooltipProps={{content: t('detail.release-lane.group-by-release')}}
            />
          </Flex>
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
          rowId="rowKey"
          // The release aggregate row is a full-width, tinted, clickable section divider. The
          // tint is a subtle mix of the foreground colour so it reads in both light and dark.
          rowProps={(datum) =>
            datum.isReleaseAggregate
              ? {
                  onClick: datum.onToggleRelease,
                  style: {
                    cursor: 'pointer',
                    backgroundColor: 'color-mix(in srgb, var(--card-fg-color) 8%, transparent)',
                  },
                }
              : {}
          }
          scrollContainerRef={scrollContainerRef}
          searchFilter={filterDocuments}
        />
      </Card>
    </Flex>
  )
}
