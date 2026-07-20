import {AddIcon} from '@sanity/icons/Add'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {PublishIcon} from '@sanity/icons/Publish'
import {SearchIcon} from '@sanity/icons/Search'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Badge, Box, Card, Checkbox, Container, Flex, Menu, TextInput} from '@sanity/ui'
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
  // No scrollbar-gutter: it forces a fixed reserve the Container-based command lane doesn't have,
  // which misaligns the centered rows from the chrome as the viewport narrows. Without it, the
  // rows and chrome share the same centered inset at every width (with overlay scrollbars). The
  // minor horizontal shift when a filter toggles a non-overlay scrollbar is deferred to the shared
  // document-table work (FH-90), where header + table live in one scroll context.
}

// The command-lane search input is a fixed leading control; the filter tabs fill the rest.
const SEARCH_INPUT_STYLE: CSSProperties = {maxWidth: 280}

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
  const [searchTerm, setSearchTerm] = useState('')
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
  const laneRows = useMemo(() => {
    const filtered =
      resolvedActiveLane === RELEASE_LANE_ALL
        ? rows
        : rows.filter((row) => rowMatchesLane(row, resolvedActiveLane, releasesById))
    return filtered.map((row) => ({...row, rowKey: row.groupId}))
  }, [rows, resolvedActiveLane, releasesById])

  // Search is owned by this composition (not the low-level Table, whose search context is internal),
  // so it can live in the command lane rather than the column-header row. Applied on top of the lane
  // filter; the Table then sorts whatever it receives.
  const displayRows = useMemo(() => filterDocuments(laneRows, searchTerm), [laneRows, searchTerm])

  const handleSelectLane = useCallback((laneId: string) => {
    // Clicking the already-active segment clears the filter back to "All".
    setActiveLane((previous) => (previous === laneId ? RELEASE_LANE_ALL : laneId))
  }, [])

  const hasDocuments = !loading && rows.length > 0
  const hasReleaseControls = hasDocuments && segments.length > 1

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
      // GitHub-style: the select-all box doubles as clear — if anything visible is selected,
      // clicking it clears; otherwise it selects every currently-visible document.
      const anyVisibleSelected = [...selectableGroupIds].some((id) => previous.has(id))
      return anyVisibleSelected ? new Set() : new Set(selectableGroupIds)
    })
  }, [selectableGroupIds])

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
      {/* Command lane (three-zone header, zone 1). Persistent, so nothing shifts vertically. It
          swaps GitHub-style: idle shows browse controls (search + filter tabs); on selection it
          becomes a bulk-action toolbar — select-all + count on the left, actions on the right.
          container[3] + paddingX={2} so the lane aligns with the table's row content below (the
          shared Table centers rows at container[3]; the first column insets by 8px). */}
      {hasDocuments && (
        <Card flex="none" borderBottom paddingY={2}>
          <Container flex="none" width={3}>
            <Box paddingX={2}>
              <Flex align="center" gap={3}>
                {/* Select-all is persistent and leftmost (over the checkbox column). Clicking it
                    when anything is selected clears — so "clear" lives with the count, not between
                    actions. */}
                <Checkbox
                  aria-label={t('detail.documents.bulk.select-all')}
                  checked={allSelected}
                  data-testid="variant-bulk-select-all"
                  indeterminate={someSelected && !allSelected}
                  onChange={handleToggleAll}
                />
                {selectedVisibleCount > 0 ? (
                  <>
                    {/* Selection mode: count beside the box (primary-toned, live indicator); browse
                        controls give way to the bulk actions on the right. */}
                    <Badge data-testid="variant-bulk-selected-count" fontSize={1} tone="primary">
                      {t('detail.documents.bulk.selected', {count: selectedVisibleCount})}
                    </Badge>
                    <Box flex={1} />
                    <Flex align="center" flex="none" gap={2}>
                      <Button
                        data-testid="variant-bulk-publish"
                        disabled
                        icon={PublishIcon}
                        mode="ghost"
                        text={t('detail.documents.bulk.publish')}
                      />
                      <Button
                        data-testid="variant-bulk-delete"
                        disabled
                        icon={TrashIcon}
                        mode="ghost"
                        text={t('detail.documents.bulk.delete')}
                        tone="critical"
                      />
                      <MenuButton
                        id="variant-bulk-more"
                        button={
                          <Button
                            data-testid="variant-bulk-more"
                            icon={EllipsisHorizontalIcon}
                            mode="bleed"
                            tooltipProps={{content: t('detail.documents.bulk.more')}}
                          />
                        }
                        menu={
                          <Menu>
                            <MenuItem
                              disabled
                              icon={UnpublishIcon}
                              text={t('detail.documents.bulk.unpublish')}
                            />
                            <MenuItem
                              disabled
                              icon={AddIcon}
                              text={t('detail.documents.bulk.add-to-release')}
                            />
                          </Menu>
                        }
                        popover={{placement: 'bottom-end', portal: true}}
                      />
                    </Flex>
                  </>
                ) : (
                  <>
                    <Box flex="none" style={SEARCH_INPUT_STYLE}>
                      <TextInput
                        aria-label={t('detail.documents.table.search-placeholder')}
                        clearButton={Boolean(searchTerm)}
                        data-testid="variant-documents-search"
                        fontSize={1}
                        icon={SearchIcon}
                        onChange={(event) => setSearchTerm(event.currentTarget.value)}
                        onClear={() => setSearchTerm('')}
                        placeholder={t('detail.documents.table.search-placeholder')}
                        value={searchTerm}
                      />
                    </Box>
                    <Box flex={1} style={{minWidth: 0, overflowX: 'auto'}}>
                      {hasReleaseControls && (
                        <VariantReleaseLane
                          activeLane={resolvedActiveLane}
                          onSelectLane={handleSelectLane}
                          segments={segments}
                          totalCount={rows.length}
                        />
                      )}
                    </Box>
                  </>
                )}
              </Flex>
            </Box>
          </Container>
        </Card>
      )}
      {/* Full-width scroll region so the table borders span the pane; the shared Table centers its
          rows at container[3], matching the command lane above. */}
      <Card
        flex={1}
        data-testid="variant-documents-table"
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
        />
      </Card>
    </Flex>
  )
}
