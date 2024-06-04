import {ErrorOutlineIcon} from '@sanity/icons'
import {type ObjectSchemaType} from '@sanity/types'
import {Box, Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {useMemoObservable} from 'react-rx'
import {type DocumentPreviewStore, getPreviewStateObservable} from 'sanity'

import {useValidationMarkers} from '../../../../core/form/studio/contexts/Validation'
import {PaneItem} from '../../../components'
import {type PaneItemPreviewState} from '../../../components/paneItem/types'
import {ValidationCard} from '../../document/inspectors/validation/ValidationInspector'
import {type DocumentSheetTableRow} from './types'

export const VISIBLE_COLUMN_LIMIT = 5

const RowValidation = ({
  value,
  schemaType,
}: {
  value: DocumentSheetTableRow
  schemaType: ObjectSchemaType
}) => {
  const validation = useValidationMarkers()
  if (validation.length === 0) {
    return null
  }
  return (
    <Tooltip
      portal
      content={
        <Stack space={2} paddingY={2}>
          {validation.map((marker) => (
            <ValidationCard
              key={marker.path.join('.')}
              marker={marker}
              schemaType={schemaType}
              value={value}
            />
          ))}
        </Stack>
      }
    >
      <ErrorOutlineIcon />
    </Tooltip>
  )
}
interface PreviewCellProps extends CellContext<DocumentSheetTableRow, unknown> {
  documentPreviewStore: DocumentPreviewStore
  schemaType: ObjectSchemaType
}

export const PreviewCell = (props: PreviewCellProps) => {
  const paneProps = props.table.options.meta?.paneProps

  const {documentPreviewStore, row, schemaType} = props

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const {draft, published, isLoading} = useMemoObservable<PaneItemPreviewState>(
    () =>
      getPreviewStateObservable(
        documentPreviewStore,
        schemaType,
        row.original._id,
        'Document title',
      ),
    [documentPreviewStore, schemaType, row.original._id],
  )!
  if (isLoading) {
    return (
      <Text size={1} muted>
        Loading...
      </Text>
    )
  }
  const title = (draft?.title ?? published?.title ?? 'Untitled') as string
  const id = row.original.__metadata.idPair.publishedId
  const isSelected = paneProps?.isActive && paneProps.childItemId === id

  return (
    <Flex align="center" gap={3} flex={1} paddingX={2}>
      <Box flex={1}>
        <PaneItem
          schemaType={schemaType}
          value={{_id: row.original._id, _type: schemaType.name, title}}
          id={id}
          selected={isSelected}
        />
      </Box>
      <RowValidation schemaType={schemaType} value={row.original} />
    </Flex>
  )
}
