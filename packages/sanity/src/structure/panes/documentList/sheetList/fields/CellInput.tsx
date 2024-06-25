import {
  isNumberSchemaType,
  isStringSchemaType,
  type NumberSchemaType,
  type StringSchemaType,
} from '@sanity/types'
import {TextInput, type TextInputType} from '@sanity/ui'
import {type HTMLAttributes, useCallback, useEffect, useMemo} from 'react'
import {getNumberInputProps, getUrlInputProps} from 'sanity'

import {type CellInputType} from '../SheetListCell'

export const CellInput = ({
  cellValue,
  setCellValue,
  fieldRef,
  setShouldPreventDefaultMouseDown,
  'data-testid': dataTestId,
  fieldType,
}: CellInputType<StringSchemaType | NumberSchemaType>) => {
  const value = cellValue as string
  const handleOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCellValue(event.target.value)
    },
    [setCellValue],
  )

  useEffect(() => {
    if (fieldType?.name !== 'number') setShouldPreventDefaultMouseDown(true)
  }, [fieldType?.name, setShouldPreventDefaultMouseDown])

  const {type: typeProps, inputMode: inputModeProp} = useMemo<{
    type: TextInputType
    inputMode: HTMLAttributes<HTMLInputElement>['inputMode']
  }>(() => {
    if (!fieldType || fieldType.name === 'string' || fieldType.name === 'text')
      return {type: 'text', inputMode: 'text'}
    if (fieldType.name === 'url' && isStringSchemaType(fieldType)) {
      const {type} = getUrlInputProps(fieldType)

      return {type, inputMode: 'url'}
    }
    if (fieldType.name === 'email') {
      return {type: 'email', inputMode: 'email'}
    }
    if (fieldType.name === 'number' && isNumberSchemaType(fieldType)) {
      const {inputMode} = getNumberInputProps(fieldType)

      return {type: 'number', inputMode}
    }

    if (fieldType.name === 'date') return {type: 'date', inputMode: undefined}

    return {type: 'text', inputMode: 'text'}
  }, [fieldType])

  return (
    <TextInput
      size={0}
      radius={0}
      border={false}
      ref={fieldRef}
      type={typeProps}
      inputMode={inputModeProp}
      __unstable_disableFocusRing
      readOnly={!!fieldType.readOnly}
      style={{
        padding: '22px 16px',
      }}
      value={value ?? ''}
      data-testid={dataTestId}
      onChange={handleOnChange}
    />
  )
}
