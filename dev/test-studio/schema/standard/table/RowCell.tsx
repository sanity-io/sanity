import {AddIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Text, type Theme} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback, useMemo} from 'react'
import {
  type FieldDefinition,
  type FormPatch,
  isPrimitiveSchemaType,
  type ObjectField,
  type SchemaType,
} from 'sanity'
import {css, styled} from 'styled-components'

import {getInsertCellPatch, getRemoveCellPatch} from './tablePatches'
import {type Cell, type Column, type DataRow} from './types'

const FloatingButtons = styled.div`
  position: absolute;
  top: 50%;
  right: -12px;
  transform: translateY(-50%);
  z-index: 100;
  display: none;
  gap: 4px;
`

const RowCellContainer = styled.td((props) => {
  const {color} = getTheme_v2(props.theme as Theme)

  return css`
    padding: 8px 4px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
    border-right: 1px solid #e2e8f0;
    position: relative;

    &:hover {
      ${FloatingButtons} {
        display: flex;
      }
    }

    &:has(button[data-ui='remove-cell']:hover) {
      transition: box-shadow 0.2s ease-in-out;
      box-shadow: inset 0 0 0 2px ${color.button.ghost.critical.hovered.border};
    }
  `
})

export function RowCell(props: {
  cell: Cell | undefined
  dataRow: DataRow
  onChange: (patch: FormPatch) => void
  cellType: FieldDefinition | undefined
  column: Column
  input: React.ReactNode
  fieldValueSchemaType: ObjectField<SchemaType> | undefined
}) {
  const {cell, dataRow, input, onChange, cellType, column, fieldValueSchemaType} = props
  const handleRemoveCell = useCallback(() => {
    if (cell) {
      onChange(getRemoveCellPatch(dataRow, cell))
    }
  }, [cell, dataRow, onChange])

  const handleInsertCell = useCallback(() => {
    if (!cellType) {
      throw new Error('Cell type is required')
    }
    onChange(getInsertCellPatch(column.dataKey, cellType, dataRow))
  }, [dataRow, onChange, cellType, column.dataKey])

  const renderInline = useMemo(() => {
    if (!fieldValueSchemaType) return false
    return (
      isPrimitiveSchemaType(fieldValueSchemaType.type) ||
      // Slugs and references are not primitive but we want to render them inline
      fieldValueSchemaType.type?.name === 'slug' ||
      fieldValueSchemaType.type?.name === 'reference'
    )
  }, [fieldValueSchemaType])

  if (!cellType) {
    return (
      <RowCellContainer>
        <Box key={cell?._key}>
          <Text>No cell type found</Text>
        </Box>
      </RowCellContainer>
    )
  }

  return (
    <RowCellContainer>
      <FloatingButtons>
        {cell ? (
          <Button
            mode="ghost"
            data-ui="remove-cell"
            iconRight={TrashIcon}
            onClick={handleRemoveCell}
            space={2}
            padding={2}
          />
        ) : (
          <Button icon={AddIcon} mode="bleed" padding={2} onClick={handleInsertCell} />
        )}
      </FloatingButtons>
      {cell ? <>{renderInline ? input : <div>Not inline</div>}</> : null}
    </RowCellContainer>
  )
}
