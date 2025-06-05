import {AddIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Card, Text, type Theme} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback, useMemo, useState} from 'react'
import {
  EditPortal,
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
  top: 4px;
  right: 4px;
  z-index: 100;
  display: none;
  gap: 4px;
`

const RowCellContainer = styled.td<{theme: Theme}>((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    padding: ${props.theme.sanity.space[2]}px ${props.theme.sanity.space[1]}px;
    text-align: left;
    border-bottom: 1px solid ${theme.color.border};
    border-right: 1px solid ${theme.color.border};
    position: relative;
    background: ${theme.color.bg};
    vertical-align: bottom;
    min-width: 180px;
    max-width: 300px;

    &:hover {
      ${FloatingButtons} {
        display: flex;
      }
    }

    &:has(button[data-ui='remove-cell']:hover) {
      transition: box-shadow 0.2s ease-in-out;
      box-shadow: inset 0 0 0 2px ${theme.color.button.ghost.critical.hovered.border};
    }

    &:first-child {
      border-left: 1px solid ${theme.color.border};
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
        <Card tone="critical" padding={2} key={cell?._key}>
          <Text muted>No cell type found</Text>
        </Card>
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
      {cell ? <>{renderInline ? input : <NotInlineInputs input={input} />}</> : null}
    </RowCellContainer>
  )
}

const NotInlineInputs = ({input}: {input: React.ReactNode}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'}}>
      <Button mode="bleed" onClick={() => setIsOpen(true)} text="Edit cell" padding={2} />
      {isOpen && (
        <EditPortal
          type="dialog"
          header="Edit table cell"
          width={1}
          onClose={() => setIsOpen(false)}
        >
          <Box padding={4}>{input}</Box>
        </EditPortal>
      )}
    </div>
  )
}
