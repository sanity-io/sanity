import {Box, Card, type CardProps, Flex, Stack, Text} from '@sanity/ui'
import {get} from 'lodash'
import {Fragment, type HTMLProps, type ReactNode, type RefAttributes, useMemo} from 'react'
import {useTableContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {TooltipDelayGroupProvider} from '../../../../ui-components'
import {LoadingBlock} from '../../../components'
import {TableHeader} from './TableHeader'
import {TableProvider, type TableSort} from './TableProvider'
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
  Row?: ({
    datum,
    children,
  }: {
    datum: TableData
    children: (rowData: TableData) => JSX.Element
  }) => JSX.Element | null
  data: TableData[]
  emptyState: (() => JSX.Element) | string
  loading?: boolean
  rowId: keyof TableData
  rowActions?: ({
    datum,
  }: {
    datum: RowDatum<TableData, AdditionalRowTableData> | unknown
  }) => ReactNode
  rowProps: (datum: TableData) => Partial<TableRowProps>
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
  data,
  emptyState,
  searchFilter,
  Row,
  rowId,
  rowActions,
  rowProps = () => ({}),
  loading = false,
}: TableProps<TableData, AdditionalRowTableData>) => {
  const {searchTerm, sort} = useTableContext()

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
      function TableRow(datum: TableData | (TableData & AdditionalRowTableData)) {
        const cardRowProps = rowProps(datum as TableData)

        return (
          <Card
            key={String(datum[rowId])}
            data-testid="table-row"
            as="tr"
            border
            radius={3}
            display="flex"
            margin={-1}
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

  const tableContent = useMemo(() => {
    if (filteredData.length === 0) {
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
    }

    return filteredData.map((datum) => {
      if (!Row) return renderRow(datum)
      return (
        <Row key={String(datum[rowId])} datum={datum}>
          {renderRow}
        </Row>
      )
    })
  }, [Row, emptyState, filteredData, renderRow, rowId])

  const headers = useMemo(
    () => amalgamatedColumnDefs.map(({cell, ...header}) => ({...header, id: String(header.id)})),
    [amalgamatedColumnDefs],
  )

  if (loading) {
    return <LoadingBlock fill data-testid="table-loading" />
  }

  return (
    <Stack as="table" space={1}>
      <TableHeader headers={headers} searchDisabled={!searchTerm && !data.length} />
      <RowStack as="tbody">{tableContent}</RowStack>
    </Stack>
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
