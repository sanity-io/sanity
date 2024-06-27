import {isDocumentSchemaType, type ObjectSchemaType, type SanityDocument} from '@sanity/types'
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
import React, {useCallback, useMemo, useState} from 'react'
import {
  SearchProvider,
  set,
  toMutationPatches,
  Translate,
  unset,
  useSchema,
  useTranslation,
  useValidationStatus,
  ValidationProvider,
} from 'sanity'
import {css, styled} from 'styled-components'

import {LoadingPane} from '../../loading'
import {type BaseStructureToolPaneProps} from '../../types'
import {ColumnsControl} from './ColumnsControl'
import {DocumentSheetActions} from './DocumentSheetActions'
import {DocumentSheetListFilter} from './DocumentSheetListFilter'
import {DocumentSheetListHeader} from './DocumentSheetListHeader'
import {DocumentSheetListPaginator} from './DocumentSheetListPaginator'
import {DocumentSheetListProvider} from './DocumentSheetListProvider'
import {SheetListLocaleNamespace} from './i18n'
import {SheetListCell} from './SheetListCell'
import {type DocumentSheetTableRow} from './types'
import {useDocumentSheetColumns} from './useDocumentSheetColumns'
import {useDocumentSheetList} from './useDocumentSheetList'
import {useDocumentSheetListOperations} from './useDocumentSheetListOperations'

type DocumentSheetListPaneProps = BaseStructureToolPaneProps<'documentList'>

type GeneralDocumentOperation = (
  publishedDocumentId: string,
  fieldId: string,
  ...otherArgs: unknown[]
) => void

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
  const {t} = useTranslation(SheetListLocaleNamespace)
  const {documentSchemaType, ...paneProps} = props
  const {columns, initialColumnsVisibility} = useDocumentSheetColumns(documentSchemaType)

  const {data} = useDocumentSheetList(documentSchemaType)
  const [selectedAnchor, setSelectedAnchor] = useState<number | null>(null)

  const totalRows = data.length
  const meta = {
    selectedAnchor,
    setSelectedAnchor,
    paneProps,
  }
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
    meta,
  })

  const {rows} = table.getRowModel()

  const rowsPublishedIds = useMemo(
    () => rows.map((row) => row.original.__metadata.idPair.publishedId),
    [rows],
  )

  const rowOperations = useDocumentSheetListOperations(rowsPublishedIds, documentSchemaType.name)

  const handlePatchDocument: GeneralDocumentOperation = useCallback(
    (publishedDocumentId, fieldId, value: any) => {
      const documentOperations = rowOperations?.[publishedDocumentId]

      if (!documentOperations || documentOperations.patch.disabled !== false)
        throw new Error('Documents not ready for operations')

      const currentDocumentValue = rows.find(
        (row) => row.original.__metadata.idPair.publishedId === publishedDocumentId,
      )?.original.__metadata.snapshots.published as SanityDocument

      // force the document operations to end of current event loop
      // so that all state updates are done before patching
      setTimeout(() => {
        documentOperations.patch.execute(
          toMutationPatches([set(value, [fieldId.replace('_', '.')])]),
          currentDocumentValue,
        )
        // explicity commit after patch to avoid throttled autocommits
        documentOperations.commit.execute()
      })
    },
    [rows, rowOperations],
  )

  const handleUnsetDocumentValue: GeneralDocumentOperation = useCallback(
    (publishedDocumentId, fieldId) => {
      const documentOperations = rowOperations?.[publishedDocumentId]

      if (!documentOperations || documentOperations.patch.disabled !== false)
        throw new Error('Documents not ready for operations')

      const currentDocumentValue = rows.find(
        (row) => row.original.__metadata.idPair.publishedId === publishedDocumentId,
      )?.original.__metadata.snapshots.published as SanityDocument

      // force the document operations to end of current event loop
      // so that all state updates are done before patching
      setTimeout(() => {
        documentOperations.patch.execute(
          toMutationPatches([unset([fieldId.replace('_', '.')])]),
          currentDocumentValue,
        )
        // explicity commit after patch to avoid throttled autocommits
        documentOperations.commit.execute()
      })
    },
    [rows, rowOperations],
  )

  const readOnlyFieldGuard = useCallback(
    (operation: GeneralDocumentOperation) => {
      return (...args: [string, string, ...unknown[]]) => {
        const [publishedDocumentId, fieldId, ...otherArgs] = args
        const isReadOnlyField = table.getColumn(fieldId)?.columnDef.meta?.fieldType?.readOnly
        if (isReadOnlyField) return

        operation(publishedDocumentId, fieldId, ...otherArgs)
      }
    },
    [table],
  )

  if (table.options.meta) {
    table.setOptions((currentOptions) => {
      const nextOptions = {...currentOptions}
      if (!nextOptions.meta) return currentOptions

      nextOptions.meta.patchDocument = readOnlyFieldGuard(handlePatchDocument)
      nextOptions.meta.unsetDocumentValue = readOnlyFieldGuard(handleUnsetDocumentValue)

      return nextOptions
    })
  }

  const renderRow = useCallback(
    (row: Row<DocumentSheetTableRow>) => {
      return <DocumentRow key={row.id} row={row} docTypeName={documentSchemaType.name} />
    },
    [documentSchemaType.name],
  )

  const isReady = useMemo(() => {
    if (table.options.meta?.patchDocument && rowOperations) {
      const isSomeOperationsDisabled = Object.values(rowOperations).some(
        (operation) => operation.patch.disabled !== false || operation.commit.disabled !== false,
      )

      return !isSomeOperationsDisabled
    }
    return false
  }, [rowOperations, table.options.meta?.patchDocument])

  const renderContent = () => {
    if (!isReady) {
      return <LoadingPane paneKey={paneProps.paneKey} />
    }

    return (
      <React.Fragment>
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
              {t('row-count.label', {
                totalRows,
                itemPlural: `item${totalRows === 1 ? '' : 's'}`,
              })}
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
          <DocumentSheetActions table={table} schemaType={documentSchemaType} />
        </TableContainer>
        <Flex justify={'flex-end'} padding={3} gap={4} paddingY={5}>
          <DocumentSheetListPaginator table={table} />
        </Flex>
      </React.Fragment>
    )
  }

  return (
    <PaneContainer direction="column" paddingX={3} data-testid="document-sheet-list-pane">
      {renderContent()}
    </PaneContainer>
  )
}

export function DocumentSheetListPane(props: DocumentSheetListPaneProps) {
  const schema = useSchema()
  const typeName = props.pane.schemaTypeName
  const {t} = useTranslation(SheetListLocaleNamespace)

  const schemaType = schema.get(typeName)
  if (!schemaType || !isDocumentSchemaType(schemaType)) {
    console.error(`Schema type "${typeName}" not found`)

    return (
      <Box padding={4}>
        <Text>
          <Translate t={t} i18nKey="not-supported.no-schema-type" />
        </Text>
      </Box>
    )
  }

  return (
    <SearchProvider>
      <DocumentSheetListPaneInner {...props} documentSchemaType={schemaType} />
    </SearchProvider>
  )
}
