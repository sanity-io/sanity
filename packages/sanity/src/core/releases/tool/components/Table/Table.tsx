import {Box, Card, type CardProps, Container, Flex, Stack, Text} from '@sanity/ui'
import {
  defaultRangeExtractor,
  type Range,
  useVirtualizer,
  type VirtualItem,
} from '@tanstack/react-virtual'
import {get} from 'lodash'
import {
  Fragment,
  type HTMLProps,
  type MutableRefObject,
  type ReactNode,
  type RefAttributes,
  useMemo,
  useRef,
} from 'react'
import {styled} from 'styled-components'

import {TooltipDelayGroupProvider} from '../../../../../ui-components'
import {LoadingBlock} from '../../../../components'
import {TableHeader} from './TableHeader'
import {TableProvider, type TableSort, useTableContext} from './TableProvider'
import {type Column} from './types'

type RowDatum<TableData, AdditionalRowTableData> = AdditionalRowTableData extends undefined
  ? TableData
  : TableData & AdditionalRowTableData

export type TableRowProps = Omit<
  CardProps & Omit<HTMLProps<HTMLDivElement>, 'height' | 'as'>,
  'ref'
> &
  RefAttributes<HTMLDivElement>

export interface TableProps<TableData, AdditionalRowTableData> {
  columnDefs: Column<RowDatum<TableData, AdditionalRowTableData>>[]
  searchFilter?: (data: TableData[], searchTerm: string) => TableData[]
  data: TableData[]
  emptyState: (() => JSX.Element) | string
  loading?: boolean
  /**
   * Should be the dot separated path to the unique identifier of the row. e.g. document._id
   */
  rowId: string
  rowActions?: ({
    datum,
  }: {
    datum: RowDatum<TableData, AdditionalRowTableData> | unknown
  }) => ReactNode
  rowProps?: (datum: TableData) => Partial<TableRowProps>
  scrollContainerRef: MutableRefObject<HTMLDivElement | null>
}

const CustomCard = styled(Card)`
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  ::before {
    content: '';
    display: block;
    border: 1px solid red;
    position: absolute;
  }
`
const ITEM_HEIGHT = 59

/**
 * This function modifies the rangeExtractor to account for the offset of the virtualizer
 * in this case, the parent with overflow (the element over which the scroll happens) and the start of the virtualizer
 * don't match, because there are some elements rendered on top of the virtualizer.
 * This, will take care of adding more elements to the start of the virtualizer to account for the offset.
 */
const withVirtualizerOffset = ({
  scrollContainerRef,
  virtualizerContainerRef,
  range,
}: {
  scrollContainerRef: MutableRefObject<HTMLDivElement | null>
  virtualizerContainerRef: MutableRefObject<HTMLDivElement | null>
  range: Range
}) => {
  const parentOffset = scrollContainerRef.current?.offsetTop ?? 0
  const virtualizerOffset = virtualizerContainerRef.current?.offsetTop ?? 0
  const virtualizerScrollMargin = virtualizerOffset - parentOffset
  const topItemsOffset = Math.ceil(virtualizerScrollMargin / ITEM_HEIGHT)
  const startIndexWithOffset = range.startIndex - topItemsOffset
  const result = defaultRangeExtractor({
    ...range,
    // By modifying the startIndex, we are adding more elements to the start of the virtualizer
    startIndex: startIndexWithOffset > 0 ? startIndexWithOffset : 0,
  })
  return result
}
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
}: TableProps<TableData, AdditionalRowTableData>) => {
  const {searchTerm, sort} = useTableContext()
  const virtualizerContainerRef = useRef<HTMLDivElement | null>(null)
  const filteredData = useMemo(() => {
    const filteredResult = searchTerm && searchFilter ? searchFilter(data, searchTerm) : data
    if (!sort) return filteredResult

    return [...filteredResult].sort((a, b) => {
      // TODO: Update this tos support sorting not only by date but also by string
      const parseDate = (dateString: unknown) =>
        typeof dateString === 'string' ? Date.parse(dateString) : 0

      const aDate = parseDate(get(a, sort.column))
      const bDate = parseDate(get(b, sort.column))

      const order = aDate - bDate
      if (sort.direction === 'asc') return order
      return -order
    })
  }, [data, searchFilter, searchTerm, sort])

  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
    rangeExtractor: (range) =>
      withVirtualizerOffset({scrollContainerRef, virtualizerContainerRef, range}),
  })

  const rowActionColumnDef: Column = useMemo(
    () => ({
      id: 'actions',
      sorting: false,
      width: 50,
      header: ({headerProps: {id}}) => (
        <Flex as="th" id={id} paddingY={3} sizing="border" style={{width: 50}}>
          <Box padding={2}>
            <Text muted size={1} weight="medium">
              &nbsp;
            </Text>
          </Box>
        </Flex>
      ),
      cell: ({datum, cellProps: {id}}) => (
        <Flex as="td" id={id} align="center" flex="none" padding={3}>
          {rowActions?.({datum}) || <Box style={{width: '25px'}} />}
        </Flex>
      ),
    }),
    [rowActions],
  )

  const amalgamatedColumnDefs = useMemo(
    () => (rowActions ? [...columnDefs, rowActionColumnDef] : columnDefs),
    [columnDefs, rowActionColumnDef, rowActions],
  )

  const renderRow = useMemo(
    () =>
      function TableRow(
        datum: (TableData | (TableData & AdditionalRowTableData)) & {
          virtualRow: VirtualItem
          index: number
          isFirst: boolean
          isLast: boolean
        },
      ) {
        const cardRowProps = rowProps(datum as TableData)

        return (
          <Card
            key={String(get(datum, rowId))}
            data-testid="table-row"
            as="tr"
            borderBottom
            display="flex"
            style={{
              height: `${datum.virtualRow.size}px`,
              transform: `translateY(${datum.virtualRow.start - datum.index * datum.virtualRow.size}px)`,
            }}
            {...cardRowProps}
          >
            {amalgamatedColumnDefs.map(({cell: Cell, width, id, sorting = false}) => (
              <Fragment key={String(id)}>
                <Cell
                  datum={datum as RowDatum<TableData, AdditionalRowTableData>}
                  cellProps={{
                    as: 'td',
                    id: String(id),
                    style: {width: width || undefined},
                  }}
                  sorting={sorting}
                />
              </Fragment>
            ))}
          </Card>
        )
      },
    [amalgamatedColumnDefs, rowId, rowProps],
  )

  const emptyContent = useMemo(() => {
    if (typeof emptyState === 'string') {
      return (
        <Card
          as="tr"
          border
          radius={3}
          display="flex"
          padding={4}
          style={{
            justifyContent: 'center',
          }}
        >
          <Text as="td" muted size={1}>
            {emptyState}
          </Text>
        </Card>
      )
    }
    return emptyState()
  }, [emptyState])

  const headers = useMemo(
    () => amalgamatedColumnDefs.map(({cell, ...header}) => ({...header, id: String(header.id)})),
    [amalgamatedColumnDefs],
  )

  if (loading) {
    return <LoadingBlock fill data-testid="table-loading" />
  }

  return (
    <div ref={virtualizerContainerRef}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          // The padding accounts for the height of the <TableHeader> and extra space for padding at the bottom
          paddingBottom: '110px',
          width: '100%',
          position: 'relative',
        }}
      >
        <Container width={3} paddingX={3}>
          <Stack as="table">
            <TableHeader headers={headers} searchDisabled={!searchTerm && !data.length} />
            <Stack as="tbody">
              {filteredData.length === 0
                ? emptyContent
                : rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
                    const datum = filteredData[virtualRow.index]
                    return renderRow({
                      ...datum,
                      virtualRow,
                      index,
                      isFirst: virtualRow.index === 0,
                      isLast: virtualRow.index === filteredData.length - 1,
                    })
                  })}
            </Stack>
          </Stack>
        </Container>
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
