import {type BooleanSchemaType} from '@sanity/types'
import {Card, Checkbox, Switch} from '@sanity/ui'
import {useCallback} from 'react'
import {styled} from 'styled-components'

import {type CellInputType} from '../SheetListCell'

const Root = styled(Card)`
  width: 100%;
`

export function BooleanCellInput(props: CellInputType<BooleanSchemaType>) {
  const {cellValue, fieldType, setCellValue, handlePatchField, fieldRef} = props
  const layout = fieldType?.options?.layout || 'switch'

  const indeterminate = typeof cellValue !== 'boolean'
  const checked = typeof cellValue === 'boolean' ? cellValue : false

  const LayoutSpecificInput = layout === 'checkbox' ? Checkbox : Switch

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.checked
      setCellValue(value)
      handlePatchField(value)
    },
    [setCellValue, handlePatchField],
  )

  return (
    <LayoutSpecificInput
      data-testid="boolean-input"
      label={fieldType?.title}
      checked={checked}
      readOnly={!!fieldType.readOnly}
      indeterminate={indeterminate}
      onChange={handleChange}
      ref={fieldRef}
    />
  )
}
