import {Box, Flex, Text, TextInput} from '@sanity/ui'
import {createColumnHelper} from '@tanstack/react-table'
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

const PreviewCell = (props: {
  documentPreviewStore: DocumentPreviewStore
  schemaType: SchemaType
  row: {
    original: SanityDocument
  }
}) => {
  console.log('props', props)
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
const columnHelper = createColumnHelper<SanityDocument>()
const SUPPORTED_FIELDS = ['string', 'number']
export function useDocumentSheetColumns(schemaType?: SchemaType) {
  const documentPreviewStore = useDocumentPreviewStore()
  console.log('TYPE', schemaType)

  const columns = useMemo(() => {
    if (!schemaType) {
      return []
    }
    const cols = [
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
    ]
    for (const field of schemaType.fields) {
      if (!SUPPORTED_FIELDS.includes(field.type.name)) {
        continue
      }

      cols.push(
        columnHelper.accessor(field.name, {
          header: field.type.title,
          cell: (info) => {
            const renderValue = info.getValue()
            return <TableTextInput {...info} />
            if (typeof renderValue === 'string' || typeof renderValue === 'number') {
              return <Text size={0}>{renderValue}</Text>
            }
            return <Text size={0}>{JSON.stringify(info.getValue())}</Text>
          },
        }),
      )
    }
    return cols
  }, [documentPreviewStore, schemaType])

  return columns
}
