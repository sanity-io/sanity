import {SearchIcon} from '@sanity/icons/Search'
import {Badge, Box, Card, Checkbox, Container, Flex, TextInput, useMediaIndex} from '@sanity/ui'
import {type CSSProperties, type ReactNode, useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../../ui-components'
import {Table} from './Table'
import {type TableSort} from './TableProvider'
import {type Column} from './types'

const TABLE_CARD_STYLE: CSSProperties = {
  height: '100%',
  overflow: 'auto',
  // Reserve the scrollbar gutter symmetrically (both edges). Rows are centered in a container[3]
  // block; with a classic (non-overlay) scrollbar, filtering changes the row count, the scrollbar
  // appears/disappears, the content box width changes, and the centered rows jump relative to the
  // command lane above. "stable both-edges" keeps the content-box width constant and centered.
  scrollbarGutter: 'stable both-edges',
}

// Right-aligned, fixed-width search input.
const SEARCH_INPUT_STYLE: CSSProperties = {maxWidth: 280}

// Constant command-lane height so the browse↔bulk swap never shifts the rows below.
const COMMAND_LANE_STYLE: CSSProperties = {minHeight: 33}

// Filter-tab strip: scrolls horizontally when the tabs outrun the width, with a subtle right-edge
// fade cueing the overflow. When the tabs fit, the fade falls over empty space and is invisible.
const FILTER_TABS_STYLE: CSSProperties = {
  minWidth: 0,
  overflowX: 'auto',
  maskImage: 'linear-gradient(to right, #000 0, #000 calc(100% - 24px), transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to right, #000 0, #000 calc(100% - 24px), transparent 100%)',
}

/**
 * Declarative selection + bulk-action config for {@link DocumentTable}. When provided, the table
 * gains a leading checkbox column (select-all in the header row, per-row checkboxes) and the command
 * lane swaps to a bulk toolbar while a selection exists.
 *
 * @internal
 */
export interface DocumentTableSelection {
  labels: {
    selectAll: string
    selectRow: string
    /** e.g. "3 selected" */
    selectedCount: (count: number) => string
    clear: string
  }
  /** The bulk actions (right of the count). `compact` is true on narrow widths — collapse to a menu. */
  renderActions: (context: {
    selectedKeys: string[]
    compact: boolean
    clear: () => void
  }) => ReactNode
  /** testId for the select-all checkbox (per-surface, so existing tests keep working). */
  selectAllTestId?: string
}

/**
 * Shared document-table composition used by both the Releases and Variants detail tables. Wraps the
 * low-level {@link Table} and owns the three-zone header: a command lane (zone 1) with search + a
 * caller-provided filter-tab slot, swapping to a bulk toolbar on selection; the column-header row
 * (zone 2, caller columns + an injected select column); and the rows (zone 3). Search is owned here
 * (filtered before the Table sorts) so it lives in the command lane, not the column header.
 *
 * @internal
 */
export function DocumentTable<Row extends object>({
  rows,
  loading = false,
  columnDefs,
  rowId,
  getRowKey,
  searchPredicate,
  searchPlaceholder,
  searchTestId,
  filterTabs,
  selection,
  rowActions,
  footer,
  emptyState,
  defaultSort,
  id,
}: {
  rows: Row[]
  loading?: boolean
  columnDefs: Column<Row>[]
  rowId: string
  getRowKey: (row: Row) => string
  searchPredicate: (row: Row, searchTerm: string) => boolean
  searchPlaceholder: string
  searchTestId?: string
  filterTabs?: ReactNode
  selection?: DocumentTableSelection
  rowActions?: (props: {datum: unknown}) => ReactNode
  footer?: ReactNode
  emptyState: (() => React.JSX.Element) | string
  defaultSort?: TableSort
  /** id + data-testid for the scroll container (the filter-tab `aria-controls` target). */
  id?: string
}): React.JSX.Element {
  const mediaIndex = useMediaIndex()
  const compactBulkActions = mediaIndex < 2
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(() => new Set())

  const displayRows = useMemo(() => {
    const term = searchTerm.trim()
    return term ? rows.filter((row) => searchPredicate(row, term)) : rows
  }, [rows, searchTerm, searchPredicate])

  // Selection is keyed by the caller's row key. The count reflects only currently-visible rows so a
  // filtered-out selection never inflates the bar.
  const selectableKeys = useMemo(
    () => new Set(displayRows.map((row) => getRowKey(row))),
    [displayRows, getRowKey],
  )
  const selectedVisibleCount = useMemo(
    () => [...selectedKeys].filter((key) => selectableKeys.has(key)).length,
    [selectedKeys, selectableKeys],
  )
  const allSelected = selectableKeys.size > 0 && selectedVisibleCount === selectableKeys.size
  const someSelected = selectedVisibleCount > 0

  const toggleRow = useCallback((key: string) => {
    setSelectedKeys((previous) => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedKeys((previous) => {
      // Doubles as clear: if anything visible is selected, clicking clears; otherwise selects all.
      const anyVisibleSelected = [...selectableKeys].some((key) => previous.has(key))
      return anyVisibleSelected ? new Set() : new Set(selectableKeys)
    })
  }, [selectableKeys])

  const clearSelection = useCallback(() => setSelectedKeys(new Set()), [])

  const selectColumn = useMemo<Column<Row> | null>(() => {
    if (!selection) return null
    const {labels, selectAllTestId} = selection
    return {
      id: 'select',
      width: 44,
      style: {minWidth: 44, maxWidth: 44},
      sorting: false,
      // Select-all lives in the column-header row (above the row checkboxes it governs), not the
      // command lane. Doubles as clear.
      header: ({headerProps}) => (
        <Flex {...headerProps} align="center" justify="center" paddingY={3} sizing="border">
          <Checkbox
            aria-label={labels.selectAll}
            checked={allSelected}
            data-testid={selectAllTestId}
            indeterminate={someSelected && !allSelected}
            onChange={toggleAll}
          />
        </Flex>
      ),
      cell: ({cellProps, datum}) => (
        <Flex {...cellProps} align="center" justify="center" paddingX={2} sizing="border">
          {!datum.isLoading && (
            <Checkbox
              aria-label={labels.selectRow}
              checked={selectedKeys.has(getRowKey(datum))}
              onChange={() => toggleRow(getRowKey(datum))}
              onClick={(event) => event.stopPropagation()}
            />
          )}
        </Flex>
      ),
    }
  }, [selection, allSelected, someSelected, toggleAll, selectedKeys, getRowKey, toggleRow])

  const amalgamatedColumnDefs = useMemo(
    () => (selectColumn ? [selectColumn, ...columnDefs] : columnDefs),
    [selectColumn, columnDefs],
  )

  const selectedKeyList = useMemo(
    () => [...selectedKeys].filter((key) => selectableKeys.has(key)),
    [selectedKeys, selectableKeys],
  )

  const hasDocuments = !loading && rows.length > 0
  const showBulkToolbar = Boolean(selection) && selectedVisibleCount > 0

  return (
    <Flex direction="column" flex={1} height="fill" overflow="hidden" style={{minHeight: 0}}>
      {/* Command lane (zone 1). Fixed height so the browse↔bulk swap never shifts the rows. Idle:
          filter tabs lead from the left (aligned with the columns), search is right-aligned. On
          selection: selected count + Clear on the left, caller's bulk actions on the right.
          container[3] + paddingX={2} aligns the lane with the table's row content below. */}
      {hasDocuments && (
        <Card flex="none" borderBottom paddingY={2}>
          <Container flex="none" width={3}>
            <Box paddingX={2}>
              <Flex align="center" gap={3} style={COMMAND_LANE_STYLE}>
                {showBulkToolbar && selection ? (
                  <>
                    <Badge data-testid="document-table-selected-count" fontSize={1} tone="primary">
                      {selection.labels.selectedCount(selectedVisibleCount)}
                    </Badge>
                    <Button
                      data-testid="document-table-clear-selection"
                      mode="bleed"
                      onClick={clearSelection}
                      text={selection.labels.clear}
                    />
                    <Box flex={1} />
                    {selection.renderActions({
                      selectedKeys: selectedKeyList,
                      compact: compactBulkActions,
                      clear: clearSelection,
                    })}
                  </>
                ) : (
                  <>
                    {filterTabs ? (
                      <Box flex={1} style={FILTER_TABS_STYLE}>
                        {filterTabs}
                      </Box>
                    ) : (
                      <Box flex={1} />
                    )}
                    <Box flex="none" style={SEARCH_INPUT_STYLE}>
                      <TextInput
                        aria-label={searchPlaceholder}
                        clearButton={Boolean(searchTerm)}
                        data-testid={searchTestId}
                        fontSize={1}
                        icon={SearchIcon}
                        onChange={(event) => setSearchTerm(event.currentTarget.value)}
                        onClear={() => setSearchTerm('')}
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                      />
                    </Box>
                  </>
                )}
              </Flex>
            </Box>
          </Container>
        </Card>
      )}
      <Card data-testid={id} flex={1} id={id} ref={setScrollContainerRef} style={TABLE_CARD_STYLE}>
        <Table<Row>
          columnDefs={amalgamatedColumnDefs}
          data={displayRows}
          defaultSort={defaultSort}
          emptyState={emptyState}
          loading={loading}
          rowActions={rowActions}
          rowId={rowId}
          scrollContainerRef={scrollContainerRef}
        />
      </Card>
      {footer}
    </Flex>
  )
}
