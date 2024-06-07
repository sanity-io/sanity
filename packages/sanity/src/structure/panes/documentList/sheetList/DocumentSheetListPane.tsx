import {isDocumentSchemaType, type ObjectSchemaType} from '@sanity/types'
import {Box, Flex, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type Row,
  useReactTable,
} from '@tanstack/react-table'
import {useCallback, useEffect, useRef, useState} from 'react'
import {SearchProvider, useSchema, useSearchState, useValidationStatus} from 'sanity'
import {css, styled} from 'styled-components'

import {ValidationProvider} from '../../../../core/form/studio/contexts/Validation'
import {type BaseStructureToolPaneProps} from '../../types'
import {ColumnsControl} from './ColumnsControl'
import {DocumentSheetActions} from './DocumentSheetActions'
import {DocumentSheetListFilter} from './DocumentSheetListFilter'
import {DocumentSheetListHeader} from './DocumentSheetListHeader'
import {DocumentSheetListPaginator} from './DocumentSheetListPaginator'
import {DocumentSheetListProvider} from './DocumentSheetListProvider'
import {SheetListCell} from './SheetListCell'
import {type DocumentSheetTableRow} from './types'
import {useDocumentSheetColumns} from './useDocumentSheetColumns'
import {useDocumentSheetList} from './useDocumentSheetList'

type DocumentSheetListPaneProps = BaseStructureToolPaneProps<'documentList'>

const PaneContainer = styled(Flex)`
  height: 100%;
`
const TableContainer = styled.div`
  overflow: auto; //our scrollable table container
  position: relative; //needed for sticky header
`
const Table = styled.table`
  border-collapse: separate;
  border-spacing: 0;
  font-family: arial, sans-serif;
  white-space: nowrap;

  thead {
    display: grid;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  tr {
    padding: 0;
  }
  tr:last-child {
    border-bottom: none;
  }
`

const TableRow = styled(Box)((props) => {
  const theme = getTheme_v2(props.theme)
  const shadowColor = theme.color.button.default.primary.enabled.bg
  return css`
    display: flex;
    width: 100%;
    &[data-selected='true'] {
      > td {
        transition:
          box-shadow 0.2s,
          border-color 0.2s;
        border-top-color: ${shadowColor};
        box-shadow: inset 0px -1px 0px 0px ${shadowColor}; // Bottom border
      }
      > td:first-child {
        box-shadow:
          inset 0px -1px 0px 0px ${shadowColor},
          inset 1px 0px 0px 0px ${shadowColor}; // Left and bottom border
      }
      > td:last-child {
        box-shadow:
          inset 0px -1px 0px 0px ${shadowColor},
          inset -1px 0px 0px 0px ${shadowColor}; // Right and bottom border
      }
    }
  `
})

const TableActionsWrapper = styled(Flex)`
  flex-shrink: 0;
`

const DocumentRow = ({
  row,
  docTypeName,
}: {
  row: Row<DocumentSheetTableRow>
  docTypeName: string
}) => {
  const validationStatus = useValidationStatus(
    row.original.__metadata.idPair.publishedId,
    docTypeName,
  )
  return (
    <ValidationProvider validation={validationStatus.validation}>
      <TableRow
        as="tr"
        key={row.original._id + row.id}
        paddingY={2}
        data-selected={row.getIsSelected()}
      >
        {row.getVisibleCells().map((cell) => (
          <SheetListCell {...cell} key={row.original._id + cell.id} />
        ))}
      </TableRow>
    </ValidationProvider>
  )
}
function DocumentSheetListPaneInner(
  props: DocumentSheetListPaneProps & {documentSchemaType: ObjectSchemaType},
) {
  const {documentSchemaType, ...paneProps} = props
  const {dispatch, state} = useSearchState()
  const {columns, initialColumnsVisibility} = useDocumentSheetColumns(documentSchemaType)
  const paneContainerRef = useRef<HTMLDivElement | null>(null)

  const {data} = useDocumentSheetList({
    typeName: documentSchemaType.name,
  })
  const [selectedAnchor, setSelectedAnchor] = useState<number | null>(null)

  const totalRows = state.result.hits.length
  const table = useReactTable({
    data,
    columns,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Avoids resetting the page index when the data changes, e.g. a mutation is received
    autoResetPageIndex: false,
    initialState: {
      columnPinning: {left: ['selected', 'Preview']},
      pagination: {pageSize: 25},
      columnVisibility: initialColumnsVisibility,
    },
    getRowId: (row) => row._id,
    meta: {
      selectedAnchor,
      setSelectedAnchor,
      patchDocument: (documentId, fieldId, value) => null,
      paneProps,
    },
  })

  const {rows} = table.getRowModel()

  useEffect(() => {
    dispatch({type: 'TERMS_TYPE_ADD', schemaType: documentSchemaType})
    return () => {
      dispatch({type: 'TERMS_TYPE_REMOVE', schemaType: documentSchemaType})
    }
  }, [documentSchemaType, dispatch])

  const renderRow = useCallback(
    (row: Row<DocumentSheetTableRow>) => {
      return <DocumentRow key={row.id} row={row} docTypeName={documentSchemaType.name} />
    },
    [documentSchemaType.name],
  )

  const rowsCount = `List total: ${totalRows} item${totalRows === 1 ? '' : 's'}`
  return (
    <PaneContainer
      direction="column"
      paddingX={3}
      data-testid="document-sheet-list-pane"
      ref={paneContainerRef}
    >
      <TableActionsWrapper
        direction="row"
        align="center"
        paddingY={3}
        paddingX={1}
        justify="space-between"
      >
        <Flex direction="row" align="center">
          <DocumentSheetListFilter />
          <Text size={0} muted>
            {rowsCount}
          </Text>
        </Flex>
        <ColumnsControl table={table} />
      </TableActionsWrapper>
      <TableContainer>
        <DocumentSheetListProvider table={table}>
          <Table>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Box as="tr" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <DocumentSheetListHeader
                      key={header.id}
                      header={header}
                      headerGroup={headerGroup}
                      table={table}
                    />
                  ))}
                </Box>
              ))}
            </thead>
            <tbody>{table.getRowModel().rows.map(renderRow)}</tbody>
          </Table>
        </DocumentSheetListProvider>
        <DocumentSheetActions
          table={table}
          schemaType={documentSchemaType}
          parentRef={paneContainerRef.current}
        />
      </TableContainer>
      <Flex justify={'flex-end'} padding={3} gap={4} paddingY={5}>
        <DocumentSheetListPaginator table={table} />
      </Flex>
    </PaneContainer>
  )
}

export function DocumentSheetListPane(props: DocumentSheetListPaneProps) {
  const schema = useSchema()
  const typeName = props.pane.schemaTypeName

  const schemaType = schema.get(typeName)
  if (!schemaType || !isDocumentSchemaType(schemaType)) {
    throw new Error(`Schema type "${typeName}" not found or not a document schema`)
  }
  return (
    <SearchProvider>
      <DocumentSheetListPaneInner {...props} documentSchemaType={schemaType} />
    </SearchProvider>
  )
}
