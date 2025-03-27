'use no memo'
// The `use no memo` directive is due to a known issue with react-virtual and react compiler: https://github.com/TanStack/virtual/issues/736

import {Box, Card, type CardProps, Flex, Text} from '@sanity/ui'
import {useVirtualizer, type VirtualItem} from '@tanstack/react-virtual'
import {isValid} from 'date-fns'
import {get} from 'lodash'
import {
  type CSSProperties,
  Fragment,
  type HTMLProps,
  type RefAttributes,
  useMemo,
  useRef,
} from 'react'

import {TooltipDelayGroupProvider} from '../../../../../ui-components'
import {TableEmptyState} from './TableEmptyState'
import {TableHeader} from './TableHeader'
import {TableLayout} from './TableLayout'
import {TableProvider, type TableSort, useTableContext} from './TableProvider'
import {type Column} from './types'
import {vars} from '@sanity/ui/css'

type RowDatum<TableData, AdditionalRowTableData> = (AdditionalRowTableData extends undefined
  ? TableData
  : TableData & AdditionalRowTableData) & {isLoading?: boolean}

export type TableRowProps = CardProps<'tr'>

type VirtualDatum = {
  virtualRow: VirtualItem
  index: number
  isFirst: boolean
  isLast: boolean
}

export interface TableProps<TableData, AdditionalRowTableData> {
  columnDefs: Column<RowDatum<TableData, AdditionalRowTableData>>[]
  searchFilter?: (data: TableData[], searchTerm: string) => TableData[]
  data: TableData[]
  emptyState: (() => React.JSX.Element) | string
  loading?: boolean
  /**
   * Should be the dot separated path to the unique identifier of the row. e.g. document._id
   */
  rowId: string
  rowActions?: ({
    datum,
  }: {
    datum: RowDatum<TableData, AdditionalRowTableData> | unknown
  }) => React.ReactNode
  rowProps?: (datum: TableData) => Partial<TableRowProps>
  scrollContainerRef: HTMLDivElement | null
  hideTableInlinePadding?: boolean
}

const ITEM_HEIGHT = 59
const LOADING_ROW_COUNT = 3

const TableInner = <TableData, AdditionalRowTableData>({
  columnDefs,
  data,
  emptyState,
  searchFilter,
  rowId,
  rowActions,
  loading = false,
  rowProps = () => ({}),
  scrollContainerRef,
  hideTableInlinePadding = false,
}: TableProps<TableData, AdditionalRowTableData>) => {
  const {searchTerm, sort} = useTableContext()
  const virtualizerContainerRef = useRef<HTMLDivElement | null>(null)
  const filteredData = useMemo(() => {
    const filteredResult = searchTerm && searchFilter ? searchFilter(data, searchTerm) : data
    if (!sort) return filteredResult

    const sortColumn = columnDefs.find((column) => column.id === sort.column)
    return [...filteredResult].sort((a, b) => {
      let order: number

      const [aValue, bValue]: (number | string)[] = [a, b].map(
        (sortValue) =>
          sortColumn?.sortTransform?.(
            sortValue as RowDatum<TableData, AdditionalRowTableData>,
            sort.direction,
          ) ?? get(sortValue, sort.column),
      )
      if (
        typeof aValue === 'string' &&
        typeof bValue === 'string' &&
        !isValid(aValue) &&
        !isValid(bValue)
      ) {
        order = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
      } else {
        const parseDate = (datum: number | string) => {
          if (sortColumn?.sortTransform && typeof datum === 'number') return datum

          return typeof datum === 'string' ? Date.parse(datum) : 0
        }

        const [aDate, bDate] = [aValue, bValue].map(parseDate)

        order = aDate - bDate
      }

      if (sort.direction === 'asc') return order
      return -order
    })
  }, [columnDefs, data, searchFilter, searchTerm, sort])

  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => scrollContainerRef,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  })

  const rowActionColumnDef: Column = useMemo(
    () => ({
      id: 'actions',
      sorting: false,
      width: 50,
      header: ({headerProps: {id}}) => (
        <Flex as="th" id={id} paddingY={3} paddingX={3} sizing="border" style={{width: '50px'}}>
          <Text muted size={1} weight="medium">
            &nbsp;
          </Text>
        </Flex>
      ),
      cell: ({datum, cellProps: {id}}) => (
        <Flex as="td" id={id} align="center" flex="none" padding={3} style={{width: '25px'}}>
          {(!datum.isLoading && rowActions?.({datum})) || <Box style={{width: '25px'}} />}
        </Flex>
      ),
    }),
    [rowActions],
  )

  const amalgamatedColumnDefs = useMemo(
    () =>
      (rowActions ? [...columnDefs, rowActionColumnDef] : columnDefs).filter(
        (column) => !column.hidden,
      ),
    [columnDefs, rowActionColumnDef, rowActions],
  )

  const renderRow = useMemo(
    () =>
      function TableRow(
        datum: VirtualDatum &
          (TableData | (TableData & AdditionalRowTableData) | {_id: string; isLoading: boolean}),
      ) {
        const cardRowProps = rowProps(datum as TableData)
        const cardKey = loading ? `skeleton-${datum.index}` : String(get(datum, rowId))

        // cardRowProps.children

        return (
          <Card
            key={cardKey}
            data-testid={loading ? 'table-row-skeleton' : 'table-row'}
            borderBottom
            display="flex"
            data-index={datum.index}
            as="tr"
            style={{
              height: `${datum.virtualRow.size}px`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${datum.virtualRow.start}px)`,
              paddingInline: `max(
                calc((100% - var(--maxInlineSize)) / 2),
                var(--paddingInline)
              )`,
            }}
            {...cardRowProps}
          >
            {amalgamatedColumnDefs.map(({cell: Cell, style, width, id, sorting = false}) => (
              <Fragment key={String(id)}>
                <Cell
                  datum={
                    {...datum, isLoading: loading} as RowDatum<TableData, AdditionalRowTableData>
                  }
                  cellProps={{
                    as: 'td',
                    id: String(id),
                    style: {...style, width: width || undefined},
                  }}
                  sorting={sorting}
                />
              </Fragment>
            ))}
          </Card>
        )
      },
    [amalgamatedColumnDefs, loading, rowId, rowProps],
  )

  const emptyContent = useMemo(
    () => <TableEmptyState emptyState={emptyState} colSpan={amalgamatedColumnDefs.length} />,
    [amalgamatedColumnDefs.length, emptyState],
  )

  const headers = useMemo(
    () =>
      amalgamatedColumnDefs.map(({cell, sortTransform, ...header}) => ({
        ...header,
        id: String(header.id),
      })),
    [amalgamatedColumnDefs],
  )

  const renderLoadingRows = (
    rowRenderer: (
      datum: VirtualDatum &
        ({_id: string; isLoading: boolean} | TableData | (TableData & AdditionalRowTableData)),
    ) => React.ReactNode,
  ) => {
    return Array.from({length: LOADING_ROW_COUNT}).map((el, index) => {
      const cardKey = `skeleton-${index}`
      const virtualRow: VirtualItem = {
        index,
        start: index * ITEM_HEIGHT,
        size: ITEM_HEIGHT,
        lane: 0,
        key: cardKey,
        end: index * ITEM_HEIGHT + ITEM_HEIGHT,
      }

      return rowRenderer({
        _id: cardKey,
        isLoading: true,
        virtualRow,
        index,
        isFirst: index === 0,
        isLast: index === LOADING_ROW_COUNT - 1,
      })
    })
  }

  const tableContent = () => {
    if (loading) {
      return renderLoadingRows(renderRow)
    }

    if (filteredData.length === 0) {
      return emptyContent
    }

    return rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
      const datum = filteredData[virtualRow.index]
      return renderRow({
        ...datum,
        virtualRow,
        index,
        isFirst: virtualRow.index === 0,
        isLast: virtualRow.index === filteredData.length - 1,
      })
    })
  }

  return (
    <div ref={virtualizerContainerRef} style={{height: '100%'}}>
      <div
        style={
          {
            'width': '100%',
            'height': '100%',
            'position': 'relative',
            '--maxInlineSize': hideTableInlinePadding ? 0 : vars.container[3],
            '--paddingInline': vars.space[3],
          } as CSSProperties
        }
      >
        <TableLayout
          isEmptyState={filteredData.length === 0 && !loading}
          header={
            <TableHeader
              headers={headers}
              searchDisabled={loading || (!searchTerm && !data.length)}
            />
          }
          content={tableContent()}
          contentHeight={`${rowVirtualizer.getTotalSize()}px`}
        />
      </div>
    </div>
  )
}

export const Table = <TableData, AdditionalRowTableData = undefined>({
  defaultSort,
  ...props
}: TableProps<TableData, AdditionalRowTableData> & {defaultSort?: TableSort}) => {
  return (
    <TooltipDelayGroupProvider>
      <TableProvider defaultSort={defaultSort}>
        <TableInner<TableData, AdditionalRowTableData> {...props} />
      </TableProvider>
    </TooltipDelayGroupProvider>
  )
}
