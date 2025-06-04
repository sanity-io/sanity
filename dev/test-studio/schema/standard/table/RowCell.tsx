import {AddIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {type FieldDefinition, type FormPatch} from 'sanity'
import {styled} from 'styled-components'

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

const RowCellContainer = styled.td`
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
`

export function RowCell(props: {
  cell: Cell | undefined
  dataRow: DataRow
  children: React.ReactNode
  onChange: (patch: FormPatch) => void
  cellType: FieldDefinition | undefined
  column: Column
}) {
  const {cell, dataRow, children, onChange, cellType, column} = props
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
            iconRight={TrashIcon}
            onClick={handleRemoveCell}
            space={2}
            padding={2}
          />
        ) : (
          <Button icon={AddIcon} mode="bleed" padding={2} onClick={handleInsertCell} />
        )}
      </FloatingButtons>
      {children}
    </RowCellContainer>
  )
}
