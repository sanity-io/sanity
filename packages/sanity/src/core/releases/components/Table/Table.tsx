import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {get} from 'lodash'
import {Fragment, useMemo} from 'react'
import {useTableContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {LoadingBlock} from '../../../components'
import {TableHeader} from './TableHeader'
import {TableProvider} from './TableProvider'
import {type Column} from './types'

export interface TableProps<D, AdditionalRowD> {
  columnDefs: AdditionalRowD extends undefined ? Column<D>[] : Column<D & AdditionalRowD>[]
  searchFilter?: (data: D[], searchTerm: string) => D[]
  Row?: ({datum, children}: {datum: D; children: (rowData: D) => JSX.Element}) => JSX.Element | null
  data: D[]
  emptyState: (() => JSX.Element) | string
  loading?: boolean
  rowId: keyof D
  rowActions?: ({
    datum,
  }: {
    datum: AdditionalRowD extends undefined ? D : D & AdditionalRowD
  }) => JSX.Element
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

const TableInner = <D, AdditionalRowD>({
  columnDefs,
  data,
  emptyState,
  searchFilter,
  Row,
  rowId,
  rowActions,
  loading = false,
}: TableProps<D, AdditionalRowD>) => {
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
          {rowActions?.({datum})}
        </Flex>
      ),
    }),
    [rowActions],
  )

  const _columnDefs = useMemo(
    () => (rowActions ? [...columnDefs, rowActionColumnDef] : columnDefs),
    [columnDefs, rowActionColumnDef, rowActions],
  )

  const renderRow = useMemo(
    () =>
      function TableRow(datum: D | (D & AdditionalRowD)) {
        return (
          <Card
            key={String(datum[rowId])}
            data-testid="table-row"
            as="tr"
            border
            radius={3}
            display="flex"
            margin={-1}
          >
            {_columnDefs.map(({cell: Cell, width, id, sorting = false}) => (
              <Fragment key={String(id)}>
                <Cell
                  datum={datum as D & AdditionalRowD}
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
    [_columnDefs, rowId],
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

  const headers = useMemo(() => _columnDefs.map(({cell, ...header}) => header), [_columnDefs])

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

export const Table = <D, AdditionalRowD = undefined>(props: TableProps<D, AdditionalRowD>) => {
  return (
    <TableProvider>
      <TableInner<D, AdditionalRowD> {...props} />
    </TableProvider>
  )
}
