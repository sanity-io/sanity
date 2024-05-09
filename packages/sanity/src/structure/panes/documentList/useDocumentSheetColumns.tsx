import {Flex, Text, TextInput} from '@sanity/ui'
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
  // console.log('props', props)
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
  const [value, setValue] = useState(initialValue)

  // When the input is blurred, we'll call our table meta's updateData function
  const onBlur = () => {
    props.table.options.meta?.updateData(index, id, value)
  }

  return (
    <TextInput value={value as string} onChange={(e) => setValue(e.target.value)} onBlur={onBlur} />
  )
}

const getColsFromSchemaType = (schemaType: SchemaType, isIterableOnObject: boolean) => {
  return schemaType.fields.reduce((cols, field) => {
    const {type, name} = field
    console.log(type.name)
    // if (type.name === 'boolean') {
    //   console.log({type})
    // }
    if (SUPPORTED_FIELDS.includes(type.name)) {
      const nextCol = columnHelper.accessor(field.name, {
        header: field.type.title,
        cell: (info) => {
          console.log({info}, info.getValue())
          return <TableTextInput {...info} />
        },
      })

      return [...cols, nextCol]
    }

    if (type.name === 'object' && isIterableOnObject) {
      console.log('go deeper', name)
      return [
        ...cols,
        columnHelper.group({header: name, columns: getColsFromSchemaType(type, false)}),
      ]
    }

    return cols
  }, [])
}
const columnHelper = createColumnHelper<SanityDocument>()
const SUPPORTED_FIELDS = ['string', 'number', 'boolean']
export function useDocumentSheetColumns(schemaType?: SchemaTypeDefinition) {
  const documentPreviewStore = useDocumentPreviewStore()
  console.log('TYPE', schemaType)

  const columns = useMemo(() => {
    if (!schemaType) {
      return []
    }
    return [
      {
        header: 'Preview',
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
        header: 'Id',
        cell: (info) => {
          return <Text size={1}>{info.getValue()}</Text>
        },
      }),
      ...getColsFromSchemaType(schemaType, true),
    ]
  }, [documentPreviewStore, schemaType])

  return columns
}
