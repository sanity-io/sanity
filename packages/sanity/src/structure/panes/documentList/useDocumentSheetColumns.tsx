import {Box, Checkbox, Flex, Text} from '@sanity/ui'
import {type AccessorKeyColumnDef, createColumnHelper} from '@tanstack/react-table'
import {useMemo, useState} from 'react'
import {useMemoObservable} from 'react-rx'
import {
  type DocumentPreviewStore,
  DocumentStatusIndicator,
  getPreviewStateObservable,
  type SanityDocument,
  type SchemaType,
  useDocumentPreviewStore,
} from 'sanity'

import {type PaneItemPreviewState} from '../../components/paneItem/types'
import {DocumentSheetListSelect} from './DocumentSheetListSelect'
import {SheetListCell} from './SheetListCell'

const PreviewCell = (props: {
  documentPreviewStore: DocumentPreviewStore
  schemaType: SchemaType
  row: {
    original: SanityDocument
  }
}) => {
  const {documentPreviewStore, row, schemaType} = props
  const title = 'Document title'
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const {draft, published, isLoading} = useMemoObservable<PaneItemPreviewState>(
    () => getPreviewStateObservable(documentPreviewStore, schemaType, row.original._id, title),
    [documentPreviewStore, schemaType, row.original._id],
  )!
  if (isLoading) {
    return (
      <Text size={1} muted>
        Loading...
      </Text>
    )
  }
  const displayValue = (draft?.title ?? published?.title ?? 'Untitled') as string
  return (
    <Flex align="center" gap={3}>
      <DocumentStatusIndicator draft={draft} published={published} />
      <Text size={1}>{displayValue}</Text>
    </Flex>
  )
}

const columnHelper = createColumnHelper<SanityDocument>()
const SUPPORTED_FIELDS = ['string', 'number', 'boolean']

const getColsFromSchemaType = (schemaType: SchemaType, parentalField?: string) => {
  //@ts-expect-error - wip.
  return schemaType.fields.reduce(
    (cols: AccessorKeyColumnDef<SanityDocument, unknown>[], field: any) => {
      const {type, name} = field
      if (SUPPORTED_FIELDS.includes(type.name)) {
        const nextCol = columnHelper.accessor(
          parentalField ? `${parentalField}.${field.name}` : field.name,
          {
            header: field.type.title,
            enableHiding: true,
            cell: (info) => <SheetListCell {...info} type={type} />,
          },
        )

        return [...cols, nextCol]
      }

      // if first layer nested object
      if (type.name === 'object' && !parentalField) {
        return [
          ...cols,
          columnHelper.group({header: name, columns: getColsFromSchemaType(type, field.name)}),
        ]
      }

      return cols
    },
    [],
  )
}

export function useDocumentSheetColumns(schemaType?: SchemaType) {
  const documentPreviewStore = useDocumentPreviewStore()
  // TODO: move hasAnchorSelected to the table context once added
  const [hasAnchorSelected, setHasAnchorSelected] = useState<number | null>(null)

  const columns: AccessorKeyColumnDef<SanityDocument, unknown>[] = useMemo(() => {
    if (!schemaType) {
      return []
    }
    return [
      columnHelper.accessor('selected', {
        enableHiding: false,
        header: (info) => (
          <Box>
            <Checkbox
              style={{paddingLeft: 4}}
              indeterminate={info.table.getIsSomeRowsSelected()}
              onChange={info.table.getToggleAllPageRowsSelectedHandler()}
            />
            {/* eslint-disable-next-line i18next/no-literal-string */}
            {info.table.getSelectedRowModel().rows.length} selected
          </Box>
        ),
        cell: (info) => (
          <DocumentSheetListSelect
            {...info}
            hasAnchorSelected={hasAnchorSelected}
            setHasAnchorSelected={setHasAnchorSelected}
          />
        ),
      }),
      columnHelper.accessor('Preview', {
        enableHiding: false,
        cell: (info) => {
          return (
            <PreviewCell
              {...info}
              documentPreviewStore={documentPreviewStore}
              schemaType={schemaType}
            />
          )
        },
      }),
      ...getColsFromSchemaType(schemaType),
    ]
  }, [documentPreviewStore, hasAnchorSelected, schemaType])

  return columns
}
