import {type BooleanSchemaType} from '@sanity/types'
import {Checkbox, Switch} from '@sanity/ui'
import {useCallback} from 'react'

import {type CellInputType} from '../SheetListCell'

export function BooleanCellInput(props: CellInputType<BooleanSchemaType>) {
  const {
    cellValue,
    fieldType,
    setCellValue,
    handlePatchField,
    fieldRef,
    'data-testid': dataTestId,
  } = props
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
      data-testid={dataTestId}
      label={fieldType?.title}
      checked={checked}
      readOnly={!!fieldType.readOnly}
      indeterminate={indeterminate}
      onChange={handleChange}
      ref={fieldRef}
    />
  )
}
