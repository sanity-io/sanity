import {type BooleanSchemaType} from '@sanity/types'
import {Card, type CardTone, Checkbox, Flex, Switch} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {useCallback, useMemo} from 'react'
import {styled} from 'styled-components'

import {type DocumentSheetTableRow} from '../types'

const Root = styled(Card)`
  width: 100%;
`

export function BooleanCellInput(
  props: CellContext<DocumentSheetTableRow, unknown> & {
    fieldType: BooleanSchemaType
    readOnly?: boolean
  },
) {
  const {
    cellValue,
    fieldType,
    readOnly = false,
    getOnMouseDownHandler,
    setCellValue,
    handlePatchField,
  } = props
  const layout = fieldType?.options?.layout || 'switch'

  const indeterminate = typeof cellValue !== 'boolean'
  const checked = cellValue || false

  const LayoutSpecificInput = layout === 'checkbox' ? Checkbox : Switch

  const tone: CardTone | undefined = readOnly ? 'transparent' : undefined

  const handleOnMouseDown = useMemo(() => getOnMouseDownHandler(true), [getOnMouseDownHandler])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.checked
      setCellValue(value)
      handlePatchField?.(value)
    },
    [setCellValue, handlePatchField],
  )

  return (
    <Root
      data-testid="boolean-input"
      tone={tone}
      onMouseDown={handleOnMouseDown}
      height="fill"
      width="full"
    >
      <Flex height="fill" justify="center" align="center">
        <LayoutSpecificInput
          label={fieldType?.title}
          checked={checked}
          readOnly={readOnly}
          indeterminate={indeterminate}
          onChange={handleChange}
        />
      </Flex>
    </Root>
  )
}
