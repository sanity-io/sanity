import {ErrorOutlineIcon} from '@sanity/icons'
import {type ObjectSchemaType} from '@sanity/types'
import {Box, Flex, Stack, Tooltip} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {useValidationMarkers} from 'sanity'

import {PaneItem} from '../../../components'
import {ValidationCard} from '../../document/inspectors/validation/ValidationInspector'
import {type DocumentSheetTableRow} from './types'

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
  schemaType: ObjectSchemaType
}

export const PreviewCell = (props: PreviewCellProps) => {
  const paneProps = props.table.options.meta?.paneProps

  const {row, schemaType} = props

  const id = row.original.__metadata.idPair.publishedId
  const isSelected = paneProps?.isActive && paneProps.childItemId === id

  return (
    <Flex align="center" gap={3} flex={1} paddingX={2}>
      <Box flex={1}>
        <PaneItem schemaType={schemaType} value={row.original} id={id} selected={isSelected} />
      </Box>
      <RowValidation schemaType={schemaType} value={row.original} />
    </Flex>
  )
}
