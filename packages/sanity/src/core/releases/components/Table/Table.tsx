import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useVirtualizer, type VirtualItem} from '@tanstack/react-virtual'
import {get} from 'lodash'
import {Fragment, useMemo, useRef} from 'react'
import {styled} from 'styled-components'

import {TooltipDelayGroupProvider} from '../../../../ui-components'
import {LoadingBlock} from '../../../components'
import {TableHeader} from './TableHeader'
import {TableProvider, type TableSort, useTableContext} from './TableProvider'
import {type Column} from './types'

type RowDatum<TableData, AdditionalRowTableData> = AdditionalRowTableData extends undefined
  ? TableData
  : TableData & AdditionalRowTableData

export interface TableProps<TableData, AdditionalRowTableData> {
  columnDefs: Column<RowDatum<TableData, AdditionalRowTableData>>[]
  searchFilter?: (data: TableData[], searchTerm: string) => TableData[]
  /**
   * @deprecated This is not necessary anymore - remove in next commit
   */
  Row?: ({
    datum,
    virtualRow,
    children,
  }: {
    datum: TableData
    virtualRow: VirtualItem
    index: number
    children: (
      rowData: TableData & {
        virtualRow: VirtualItem
        index: number
      },
    ) => JSX.Element
  }) => JSX.Element | null
  data: TableData[]
  emptyState: (() => JSX.Element) | string
  loading?: boolean
  rowId: keyof TableData
  rowActions?: ({
    datum,
  }: {
    datum: RowDatum<TableData, AdditionalRowTableData> | unknown
  }) => JSX.Element
  tableHeight: string
}

const RowStack = styled(Stack)({
  '& > *:not(:first-child)': {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: -1,
  },

  '& > *:not(:last-child)': {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
})

const TableInner = <TableData, AdditionalRowTableData>({
  columnDefs,
  tableHeight,
  data,
  emptyState,
  searchFilter,
  Row,
  rowId,
  rowActions,
  loading = false,
}: TableProps<TableData, AdditionalRowTableData>) => {
  const {searchTerm, sort} = useTableContext()
  const parentRef = useRef(null)

  const filteredData = useMemo(() => {
    const filteredResult = searchTerm && searchFilter ? searchFilter(data, searchTerm) : data
    if (!sort) return filteredResult

    return [...filteredResult].sort((a, b) => {
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
    getScrollElement: () => parentRef.current,
    estimateSize: () => 57,
    overscan: 5,
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
          {rowActions?.({datum})}
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
        },
      ) {
        return (
          <Card
            key={String(datum[rowId])}
            data-testid="table-row"
            as="tr"
            border
            radius={3}
            display="flex"
            margin={-1}
            style={{
              height: `${datum.virtualRow.size}px`,
              transform: `translateY(${datum.virtualRow.start - datum.index * datum.virtualRow.size}px)`,
            }}
            // @ts-expect-error - Using a custom datum prop, this is not definitive, just a placeholder to show there is an error.
            // update once designs land
            tone={datum?.validation?.hasError ? 'critical' : 'default'}
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
    [amalgamatedColumnDefs, rowId],
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
    <div ref={parentRef} id="container" style={{height: tableHeight, overflowY: 'auto'}}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <Stack as="table" space={1}>
          <TableHeader headers={headers} searchDisabled={!searchTerm && !data.length} />
          <RowStack as="tbody">
            {filteredData.length === 0
              ? emptyContent
              : rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
                  const datum = filteredData[virtualRow.index]
                  if (Row) {
                    return (
                      <Row
                        key={String(datum[rowId])}
                        datum={datum}
                        virtualRow={virtualRow}
                        index={index}
                      >
                        {renderRow}
                      </Row>
                    )
                  }
                  return renderRow({...datum, virtualRow, index})
                })}
          </RowStack>
        </Stack>
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
