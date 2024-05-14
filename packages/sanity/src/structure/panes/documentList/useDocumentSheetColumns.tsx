// This is a WIP file, to render a very basic table view.
import {Flex, Text, TextInput} from '@sanity/ui'
import {createColumnHelper} from '@tanstack/react-table'
import {type FormEvent, useCallback, useEffect, useMemo, useState} from 'react'
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

const TableTextInput = (props: any) => {
  const {index, id} = props
  const initialValue = props.getValue()
  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue || '')

  // When the input is blurred, we'll call our table meta's updateData function
  const onBlur = () => {
    props.table.options.meta?.updateData(index, id, value)
  }

  const handleChange = useCallback(
    (e: FormEvent<HTMLInputElement>) => setValue(e.currentTarget.value),
    [],
  )

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  return <TextInput value={value as string} onChange={handleChange} onBlur={onBlur} />
}

const columnHelper = createColumnHelper<SanityDocument>()
const SUPPORTED_FIELDS = ['string', 'number']

export function useDocumentSheetColumns(schemaType?: SchemaType) {
  const documentPreviewStore = useDocumentPreviewStore()

  const columns = useMemo(() => {
    if (!schemaType) {
      return []
    }
    const cols = [
      {
        header: 'Preview',
        //@ts-expect-error - wip.
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
      // columnHelper.accessor('_id', {
      //   header: 'Id',
      //   cell: (info) => {
      //     return <Text size={1}>{info.getValue()}</Text>
      //   },
      // }),
    ]
    //@ts-expect-error - wip.
    for (const field of schemaType.fields) {
      if (!SUPPORTED_FIELDS.includes(field.type.name)) {
        continue
      }

      cols.push(
        columnHelper.accessor(field.name, {
          header: field.type.title,
          //@ts-expect-error dynamic field name access, types not generated correctly.
          cell: (info) => {
            const renderValue = info.getValue()
            // return <TableTextInput {...info} />
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
