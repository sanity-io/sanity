import {Checkbox, Flex, Select, Text, TextInput} from '@sanity/ui'
import {createColumnHelper} from '@tanstack/react-table'
import {useMemo, useState} from 'react'
import {useMemoObservable} from 'react-rx'
import {
  type DocumentPreviewStore,
  DocumentStatusIndicator,
  getPreviewStateObservable,
  type SanityDocument,
  type SchemaType,
  type SchemaTypeDefinition,
  useDocumentPreviewStore,
} from 'sanity'

import {type PaneItemPreviewState} from '../../components/paneItem/types'

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
  return (
    <Flex align="center" gap={3}>
      <DocumentStatusIndicator draft={draft} published={published} />
      <Text size={1}>{draft?.title || published?.title || 'Untitled'}</Text>
    </Flex>
  )
}

const TableTextInput = (props: any) => {
  const initialValue = props.getValue()
  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue || '')

  // When the input is blurred, we'll call our table meta's updateData function
  const onBlur = () => {
    props.table.options.meta?.updateData(index, id, value)
  }

  return (
    <TextInput value={value as string} onChange={(e) => setValue(e.target.value)} onBlur={onBlur} />
  )
}

const getColsFromSchemaType = (schemaType: SchemaType, parentalField: string) => {
  return schemaType.fields.reduce((cols, field) => {
    const {type, name} = field
    if (SUPPORTED_FIELDS.includes(type.name)) {
      const nextCol = columnHelper.accessor(
        parentalField ? `${parentalField}.${field.name}` : field.name,
        {
          header: field.type.title,
          enableHiding: true,
          cell: (info) => {
            if (!info.getValue()) return null
            if (type.name === 'boolean') {
              return (
                <Select
                  onChange={() => info.table.options.meta?.updateData(index, id, value)}
                  value={info.getValue()}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </Select>
              )
            }

            return <TableTextInput {...info} />
          },
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
  }, [])
}
const columnHelper = createColumnHelper<SanityDocument>()
const SUPPORTED_FIELDS = ['string', 'number', 'boolean']
export function useDocumentSheetColumns(schemaType?: SchemaTypeDefinition) {
  const documentPreviewStore = useDocumentPreviewStore()

  const columns = useMemo(() => {
    if (!schemaType) {
      return []
    }
    return [
      columnHelper.accessor('selected', {
        enableHiding: false,
        header: (info) => (
          <Checkbox
            indeterminate={info.table.getIsSomeRowsSelected()}
            onChange={info.table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: (info) => (
          <Checkbox
            checked={info.row.getIsSelected()}
            disabled={!info.row.getCanSelect()}
            onChange={() => info.row.toggleSelected()}
          />
        ),
      }),
      {
        header: 'Preview',
        enableHiding: false,
        accessorKey: 'preview',
        cell: (info) => {
          return (
            <PreviewCell
              {...info}
              documentPreviewStore={documentPreviewStore}
              schemaType={schemaType}
            />
          )
        },
      },
      columnHelper.accessor('_id', {
        enableHiding: true,
        header: 'Id',
        cell: (info) => {
          return <Text size={1}>{info.getValue()}</Text>
        },
      }),
      ...getColsFromSchemaType(schemaType),
    ]
  }, [documentPreviewStore, schemaType])

  return columns
}
