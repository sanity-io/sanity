import {SearchIcon} from '@sanity/icons/Search'
import {Badge, Box, Card, Checkbox, Container, Flex, TextInput, useMediaIndex} from '@sanity/ui'
import {type CSSProperties, type ReactNode, useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../../ui-components/button/Button'
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

// Default command-lane height so the browse↔bulk swap never shifts the rows below. Consumers with a
// taller browse control (e.g. the variants overview's bordered filter group) raise it via the
// `commandLaneMinHeight` prop so the shorter bulk toolbar reserves the same height.
const DEFAULT_COMMAND_LANE_MIN_HEIGHT = 33

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
export interface DocumentTableSelection<Row = unknown> {
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
  /**
   * Optional predicate: rows for which this returns false get no row checkbox and never count toward
   * the selection or select-all (e.g. pending "just added" placeholder rows that can't be bulk-acted
   * on). Defaults to every row selectable.
   */
  isRowSelectable?: (row: Row) => boolean
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
  searchWidth,
  filterTabs,
  filterTabsScroll = true,
  commandLaneMinHeight = DEFAULT_COMMAND_LANE_MIN_HEIGHT,
  alwaysShowCommandLane = false,
  commandLaneActions,
  selection,
  rowActions,
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
  /** Fixed width of the search input; defaults to 280. Set it to match a right-hand rail. */
  searchWidth?: number
  filterTabs?: ReactNode
  /**
   * When true (default), the filter-tabs slot scrolls horizontally with a right-edge fade — right for
   * tab strips that outrun the width. Set false when the consumer manages its own overflow (e.g. the
   * variants overview collapses its filter chips), so the slot just fills without a scroll or fade.
   */
  filterTabsScroll?: boolean
  /**
   * Minimum height of the command lane, reserved in both the browse and bulk states so swapping
   * between them never shifts the rows. Raise it above the default when the browse controls are
   * taller than the bulk toolbar (e.g. a bordered filter group).
   */
  commandLaneMinHeight?: number
  /**
   * Keep the command lane (filters + search) mounted even when there are zero rows, so a filter or
   * search that empties the result set doesn't also hide the controls needed to change it. Surfaces
   * that own filter tabs and/or command-lane actions (release detail behind beta.variants, the
   * variants overview) turn it on.
   */
  alwaysShowCommandLane?: boolean
  /** Extra command-lane controls rendered right of the search (e.g. an "Add document" button). */
  commandLaneActions?: ReactNode
  selection?: DocumentTableSelection<Row>
  rowActions?: (props: {datum: unknown}) => ReactNode
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
    () =>
      new Set(
        displayRows
          .filter((row) => selection?.isRowSelectable?.(row) ?? true)
          .map((row) => getRowKey(row)),
      ),
    [displayRows, getRowKey, selection],
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
          {!datum.isLoading && (selection?.isRowSelectable?.(datum) ?? true) && (
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
  // Keep the lane mounted for filter-owning surfaces even when a filter/search empties the rows (so
  // the controls to undo that never disappear with the results) AND during the initial load (so the
  // filter-tab loading skeletons stay up and the search/filters don't pop in with a layout shift
  // once documents arrive).
  const showCommandLane = hasDocuments || alwaysShowCommandLane
  const showBulkToolbar = Boolean(selection) && selectedVisibleCount > 0

  return (
    <Flex direction="column" flex={1} height="fill" overflow="hidden" style={{minHeight: 0}}>
      {/* Command lane (zone 1). Fixed height so the browse↔bulk swap never shifts the rows. Idle:
          filter tabs lead from the left (aligned with the columns), search is right-aligned. On
          selection: selected count + Clear on the left, caller's bulk actions on the right.
          container[3] + paddingX={2} aligns the lane with the table's row content below. */}
      {showCommandLane && (
        <Card flex="none" borderBottom paddingY={2}>
          <Container flex="none" width={3}>
            <Box paddingX={2}>
              <Flex align="center" gap={3} style={{minHeight: commandLaneMinHeight}}>
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
                    {filterTabs && (
                      <Box flex={1} style={filterTabsScroll ? FILTER_TABS_STYLE : {minWidth: 0}}>
                        {filterTabs}
                      </Box>
                    )}
                    {/* With filter tabs, search is a fixed-width control pinned to the right (tabs
                        lead from the left). Without them, it fills the lane so it doesn't strand a
                        wide empty gutter — e.g. the variants overview, which has no filter tabs. */}
                    <Box
                      flex={filterTabs ? 'none' : 1}
                      style={
                        filterTabs
                          ? searchWidth
                            ? {maxWidth: searchWidth}
                            : SEARCH_INPUT_STYLE
                          : undefined
                      }
                    >
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
                    {commandLaneActions ? <Box flex="none">{commandLaneActions}</Box> : null}
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
    </Flex>
  )
}
