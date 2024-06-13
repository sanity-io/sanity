import {type BooleanSchemaType} from '@sanity/types'
import {Card, type CardTone, Checkbox, Flex, Switch} from '@sanity/ui'
import {useCallback} from 'react'
import {styled} from 'styled-components'

import {type CellInputType} from '../SheetListCell'

const Root = styled(Card)`
  width: 100%;
`

export function BooleanCellInput(
  props: CellInputType<BooleanSchemaType> & {
    readOnly?: boolean
  },
) {
  const {cellValue, fieldType, readOnly = false, setCellValue, handlePatchField} = props
  const layout = fieldType?.options?.layout || 'switch'

  const indeterminate = typeof cellValue !== 'boolean'
  const checked = typeof cellValue === 'boolean' ? cellValue : false

  const LayoutSpecificInput = layout === 'checkbox' ? Checkbox : Switch

  const tone: CardTone | undefined = readOnly ? 'transparent' : undefined

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.checked
      setCellValue(value)
      handlePatchField(value)
    },
    [setCellValue, handlePatchField],
  )

  return (
    <Root data-testid="boolean-input" tone={tone} height="fill" width="full">
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
