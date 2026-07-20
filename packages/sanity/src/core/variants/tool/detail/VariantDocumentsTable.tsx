import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {PublishIcon} from '@sanity/icons/Publish'
import {StackIcon} from '@sanity/icons/Stack'
import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Card, Flex, Menu, Text} from '@sanity/ui'
import {type CSSProperties, useCallback, useMemo, useState} from 'react'

import {Button, MenuButton, MenuItem} from '../../../../ui-components'
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
import {
  getVariantDocumentTableColumnDefs,
  type VariantDocumentSelection,
} from './variantDocumentTable/VariantDocumentTableColumnDefs'
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
  const [selectedGroupIds, setSelectedGroupIds] = useState<ReadonlySet<string>>(() => new Set())
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

  // Bulk selection. Keyed by the real document groupId (stable across the flat/swimlane views, where
  // the same document can appear under several release lanes). Aggregate header rows aren't
  // selectable. Selection persists across lane/search filters; the count reflects what's currently
  // visible so a filtered-out selection never inflates the bar.
  const selectableGroupIds = useMemo(() => {
    const ids = new Set<string>()
    for (const row of displayRows) {
      if (!row.isReleaseAggregate) ids.add(row.groupId)
    }
    return ids
  }, [displayRows])

  const selectedVisibleCount = useMemo(
    () => [...selectedGroupIds].filter((id) => selectableGroupIds.has(id)).length,
    [selectedGroupIds, selectableGroupIds],
  )
  const allSelected =
    selectableGroupIds.size > 0 && selectedVisibleCount === selectableGroupIds.size
  const someSelected = selectedVisibleCount > 0

  const handleToggleRow = useCallback((groupId: string) => {
    setSelectedGroupIds((previous) => {
      const next = new Set(previous)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  const handleToggleAll = useCallback(() => {
    setSelectedGroupIds((previous) => {
      const everySelected =
        selectableGroupIds.size > 0 && [...selectableGroupIds].every((id) => previous.has(id))
      // Toggling with a full selection clears; otherwise select every currently-visible document.
      return everySelected ? new Set() : new Set(selectableGroupIds)
    })
  }, [selectableGroupIds])

  const handleClearSelection = useCallback(() => setSelectedGroupIds(new Set()), [])

  const isSelected = useCallback(
    (groupId: string) => selectedGroupIds.has(groupId),
    [selectedGroupIds],
  )

  const selection = useMemo<VariantDocumentSelection>(
    () => ({
      isSelected,
      onToggleRow: handleToggleRow,
      allSelected,
      someSelected,
      onToggleAll: handleToggleAll,
    }),
    [isSelected, handleToggleRow, allSelected, someSelected, handleToggleAll],
  )

  const columnDefs = useMemo<Column<DocumentInVariantGroup>[]>(
    () => getVariantDocumentTableColumnDefs(t, variantId, releasesById, grouped, selection),
    [t, variantId, releasesById, grouped, selection],
  )

  return (
    <Flex direction="column" flex={1} height="fill" overflow="hidden" style={{minHeight: 0}}>
      {hasReleaseControls && (
        // Bordered so the filter lane is visually distinct from the table's column-header row below.
        <Card flex="none" borderBottom paddingX={4} paddingY={3}>
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
        </Card>
      )}
      {selectedVisibleCount > 0 && (
        // Contextual bulk-action bar. Appears only while a selection exists. The publish/delete
        // actions are prototyped-but-not-wired (stubbed disabled) pending the real document
        // operations; the selection UX itself is the point of this first pass.
        <Card flex="none" borderBottom paddingX={4} paddingY={2} tone="primary">
          <Flex align="center" gap={3} justify="space-between">
            <Flex align="center" gap={3} style={{minWidth: 0}}>
              <Text size={1} weight="medium">
                {t('detail.documents.bulk.selected', {count: selectedVisibleCount})}
              </Text>
              <Text muted size={1} textOverflow="ellipsis">
                {t('detail.documents.bulk.stub-note')}
              </Text>
            </Flex>
            <Flex align="center" flex="none" gap={2}>
              <MenuButton
                id="variant-bulk-actions"
                button={
                  <Button
                    data-testid="variant-bulk-actions-menu"
                    icon={EllipsisHorizontalIcon}
                    mode="bleed"
                    text={t('detail.documents.bulk.actions')}
                  />
                }
                menu={
                  <Menu>
                    <MenuItem
                      disabled
                      icon={PublishIcon}
                      text={t('detail.documents.bulk.publish')}
                    />
                    <MenuItem
                      disabled
                      icon={TrashIcon}
                      text={t('detail.documents.bulk.delete')}
                      tone="critical"
                    />
                  </Menu>
                }
                popover={{placement: 'bottom-end', portal: true}}
              />
              <Button
                data-testid="variant-bulk-clear"
                mode="bleed"
                onClick={handleClearSelection}
                text={t('detail.documents.bulk.clear')}
              />
            </Flex>
          </Flex>
        </Card>
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
