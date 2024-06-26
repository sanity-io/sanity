import {
  type BooleanSchemaType,
  type FormNodeValidation,
  isBooleanSchemaType,
  isNumberSchemaType,
  type NumberSchemaType,
  type StringSchemaType,
} from '@sanity/types'
import {Card, type CardTone, Flex} from '@sanity/ui'
import {type Cell, type CellContext, flexRender} from '@tanstack/react-table'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {FormFieldValidationStatus, useChildValidation} from 'sanity'
import {css, styled} from 'styled-components'

import {type CellState, useDocumentSheetListContext} from './DocumentSheetListProvider'
import {type DocumentSheetListSchemaTypes, type DocumentSheetTableRow} from './types'
import {useOnMouseDownCell} from './useOnMouseDownCell'
import {getBorderWidth} from './utils'

export type CellInputType<TFieldType = DocumentSheetListSchemaTypes> = CellContext<
  DocumentSheetTableRow,
  unknown
> & {
  fieldType: TFieldType
}

const ValidationIconContainer = styled.div`
  position: absolute;
  left: 4px;
  top: 4px;
  z-index: 2;
`

const CellValidation = ({validation}: {validation: FormNodeValidation[]}) => {
  if (validation.length === 0) {
    return null
  }
  return (
    <ValidationIconContainer id="validation-icon">
      <FormFieldValidationStatus validation={validation} fontSize={0} />
    </ValidationIconContainer>
  )
}

type ValidationLevel = 'error' | 'warning' | 'info'
const validationLevelColors: {[key in ValidationLevel]: string} = {
  error: 'var(--card-badge-critical-fg-color)',
  warning: 'var(--card-badge-warning-fg-color)',
  info: 'var(--card-badge-primary-fg-color)',
}

interface DataCellProps {
  width: number
  $cellState: CellState
  $rightBorderWidth: number
  $validationLevel?: ValidationLevel
}

const Root = styled(Card)`
  width: 100%;
`

const DataCell = styled.td<DataCellProps>((props) => {
  const {width, $cellState, $rightBorderWidth, $validationLevel} = props
  const callOutColor = $validationLevel && validationLevelColors[$validationLevel]

  return css`
    display: flex;
    align-items: center;
    overflow: hidden;
    box-sizing: border-box;
    width: ${width}px;
    padding: 2px; // Allow space for the box shadow outline to show
    background-color: var(--card-bg-color);
    border-top: 1px solid var(--card-border-color);
    border-right: ${$rightBorderWidth}px solid var(--card-border-color);
    box-shadow: ${$validationLevel
      ? `
        inset 1px 0px 0px 0px var(--card-bg-color),
        inset 0px 2px 0px 0px var(--card-bg-color),
        inset 0px -2px 0px 0px var(--card-bg-color),
        inset 2px 0px 0px 0px ${callOutColor};
      `
      : 'none'};

    &[aria-selected='true'] {
      transition: box-shadow 0.1s;
      box-shadow: inset 0px 0px 0px ${$cellState === 'focused' ? 2 : 1}px
        var(--card-focus-ring-color);
    }

    & #validation-icon {
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    :hover {
      & #validation-icon {
        opacity: 1;
      }
    }
  `
})

const PinnedDataCell = styled(DataCell)`
  position: sticky;
  z-index: 2;
`

const CellRoot = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`

const getFieldValueAsFieldType = (
  providedValue: any,
  fieldType: BooleanSchemaType | StringSchemaType | NumberSchemaType,
) => {
  if (isBooleanSchemaType(fieldType)) {
    if (typeof providedValue === 'string') {
      return providedValue === 'true'
    }
    return providedValue
  }
  if (isNumberSchemaType(fieldType)) {
    return parseFloat(providedValue)
  }

  return String(providedValue)
}

/** @internal */
export function SheetListCell(cell: Cell<DocumentSheetTableRow, unknown>) {
  const isPinned = cell.column.getIsPinned()
  const {column, row, getValue, getContext} = cell

  const {fieldType, disableCellFocus} = column.columnDef.meta || {}
  const cellContext = getContext()
  const cellId = `cell-${column.id}-${row.index}`
  const providedValueRef = useRef(getValue())
  const [rawCellValue, setRawCellValue] = useState<string | number | boolean>(getValue() as string)
  const fieldRef = useRef<HTMLElement | null>(null)

  const Cell = isPinned ? PinnedDataCell : DataCell
  const {
    focusAnchorCell,
    resetFocusSelection,
    setSelectedAnchorCell,
    getStateByCellId,
    submitFocusedCell,
  } = useDocumentSheetListContext()
  const setCellAsSelectedAnchor = useCallback(() => {
    setSelectedAnchorCell(column.id, row.index)
  }, [column.id, row.index, setSelectedAnchorCell])

  const validation = useChildValidation([column.id], true)
  const validationLevel = useMemo(() => {
    if (validation.some((v) => v.level === 'error')) {
      return 'error'
    }
    if (validation.some((v) => v.level === 'warning')) {
      return 'warning'
    }
    if (validation.some((v) => v.level === 'info')) {
      return 'info'
    }
    return undefined
  }, [validation])

  const cellState = getStateByCellId(cell.column.id, cell.row.index)
  const {patchDocument, unsetDocumentValue} = cellContext.table.options.meta || {}

  const setCellValue = useCallback(
    (value: string | number | boolean) => {
      if (!fieldType?.readOnly) {
        setRawCellValue(value)
      }
    },
    [fieldType?.readOnly],
  )

  const handleProgrammaticFocus = () => {
    fieldRef.current?.focus()
    if (fieldRef.current instanceof HTMLInputElement) {
      fieldRef.current.select()
    }
  }
  const {setShouldPreventDefaultMouseDown, handleOnMouseDown} = useOnMouseDownCell(
    handleProgrammaticFocus,
    setCellAsSelectedAnchor,
  )

  const handlePatchField = useCallback(
    (value: any) => {
      if (!fieldType) return

      const typedValue = getFieldValueAsFieldType(value, fieldType)

      setCellValue(typedValue)
      patchDocument?.(row.original.__metadata.idPair.publishedId, column.id, typedValue)
    },
    [column.id, fieldType, patchDocument, row.original.__metadata.idPair.publishedId, setCellValue],
  )

  const handleUnsetField = useCallback(() => {
    unsetDocumentValue?.(row.original.__metadata.idPair.publishedId, column.id)
  }, [column.id, row.original.__metadata.idPair.publishedId, unsetDocumentValue])

  const handleOnKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const {key} = event

      switch (key) {
        case 'Enter': {
          if (cellState === 'selectedAnchor') handleProgrammaticFocus()
          if (cellState === 'focused') submitFocusedCell()
          break
        }
        case 'Escape': {
          if (cellState === 'focused') {
            setCellValue(providedValueRef.current as string)

            // wait for state to settle before blurring
            setTimeout(() => setCellAsSelectedAnchor())
          }
          break
        }

        case 'Delete':
        case 'Backspace': {
          if (cellState !== 'focused') {
            setCellValue('')
            handleUnsetField()
          }
          break
        }

        default:
          break
      }
    },
    [cellState, handleUnsetField, setCellAsSelectedAnchor, setCellValue, submitFocusedCell],
  )

  const handleOnFocus = useCallback(() => {
    // reselect in cases where focus achieved without initial mousedown
    setCellAsSelectedAnchor()
    focusAnchorCell()
  }, [focusAnchorCell, setCellAsSelectedAnchor])

  const handleOnBlur = useCallback(() => {
    if (rawCellValue !== providedValueRef.current) {
      handlePatchField(rawCellValue)
    }
    resetFocusSelection()
  }, [handlePatchField, rawCellValue, resetFocusSelection])

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData?.getData('Text')
      if (!clipboardData || !fieldType) return
      if (
        isBooleanSchemaType(fieldType) &&
        typeof clipboardData !== 'boolean' &&
        !['true', 'false'].includes(clipboardData)
      ) {
        return
      }

      const typedValue = getFieldValueAsFieldType(clipboardData, fieldType)
      handlePatchField(typedValue)
    },
    [handlePatchField, fieldType],
  )

  const handleCopy = useCallback(() => {
    if (typeof rawCellValue === 'undefined') return
    navigator.clipboard.writeText(rawCellValue.toString())
  }, [rawCellValue])

  useEffect(() => {
    if (cellState)
      // only listen for key when cell is selected or focused
      document.addEventListener('keydown', handleOnKeyDown)
    if (cellState === 'selectedAnchor' || cellState === 'selectedRange')
      // if cell is selected, paste events should be handled
      document.addEventListener('paste', handlePaste)

    if (cellState === 'selectedAnchor' || cellState === 'focused')
      // only allow copying when cell is selected anchor or focused
      document.addEventListener('copy', handleCopy)

    return () => {
      if (cellState) document.removeEventListener('keydown', handleOnKeyDown)
      if (cellState === 'selectedAnchor' || cellState === 'selectedRange')
        document.removeEventListener('paste', handlePaste)
      if (cellState === 'selectedAnchor' || cellState === 'focused')
        document.removeEventListener('copy', handleCopy)
    }
  }, [cellState, handleCopy, handleOnKeyDown, handlePaste])

  // Keep value of cell up to date with external changes
  const realTimeValue = getValue()
  useEffect(() => {
    if (providedValueRef?.current !== realTimeValue) {
      if (providedValueRef.current === rawCellValue) {
        // only update the value if it's not current being edited
        setRawCellValue(realTimeValue as string)
      }
      providedValueRef.current = realTimeValue
    }
  }, [realTimeValue, rawCellValue])

  const cellProps = {
    'onFocus': disableCellFocus ? undefined : handleOnFocus,
    'onBlur': handleOnBlur,
    'aria-selected': !!cellState,
    'id': cellId,
    'data-testid': cellId,
    'onMouseDown': handleOnMouseDown,
  }

  const inputProps = {
    ...cellContext,
    handlePatchField,
    handleUnsetField,
    'cellValue': rawCellValue,
    setCellValue,
    setShouldPreventDefaultMouseDown,
    fieldRef,
    'data-testid': `${cellId}-input-field`,
  }

  const tone: CardTone | undefined = fieldType?.readOnly ? 'transparent' : undefined

  return (
    <Cell
      $cellState={cellState}
      $validationLevel={validationLevel}
      $rightBorderWidth={getBorderWidth(cell)}
      key={cell.row.original._id + cell.id}
      style={{
        left: cell.column.getStart('left') ?? undefined,
      }}
      width={cell.column.getSize()}
      {...cellProps}
    >
      <CellRoot>
        <CellValidation validation={validation} />
        <Root tone={tone} height="fill" width="full">
          <Flex height="fill" justify="center" align="center">
            {flexRender(cell.column.columnDef.cell, inputProps)}
          </Flex>
        </Root>
      </CellRoot>
    </Cell>
  )
}
