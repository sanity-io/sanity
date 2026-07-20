import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {PublishIcon} from '@sanity/icons/Publish'
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
import {computeReleaseLaneSegments, RELEASE_LANE_ALL, rowMatchesLane} from './releaseLane'
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

  // Bulk selection. Keyed by the document groupId. Selection persists across lane/search filters;
  // the count reflects what's currently visible so a filtered-out selection never inflates the bar.
  const selectableGroupIds = useMemo(() => {
    const ids = new Set<string>()
    for (const row of displayRows) {
      ids.add(row.groupId)
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
    () => getVariantDocumentTableColumnDefs(t, variantId, releasesById, selection),
    [t, variantId, releasesById, selection],
  )

  return (
    <Flex direction="column" flex={1} height="fill" overflow="hidden" style={{minHeight: 0}}>
      {hasReleaseControls && (
        // Bordered so the filter lane is visually distinct from the table's column-header row below.
        <Card flex="none" borderBottom paddingX={4} paddingY={3}>
          <Box style={{minWidth: 0, overflowX: 'auto'}}>
            <VariantReleaseLane
              activeLane={resolvedActiveLane}
              onSelectLane={handleSelectLane}
              segments={segments}
              totalCount={rows.length}
            />
          </Box>
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
          scrollContainerRef={scrollContainerRef}
          searchFilter={filterDocuments}
        />
      </Card>
    </Flex>
  )
}
