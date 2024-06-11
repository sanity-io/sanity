import {TextInput} from '@sanity/ui'
import {type MutableRefObject} from 'react'

type Props = {
  'cellValue': number | string
  'setCellValue': (value: number | string) => void
  'fieldRef': MutableRefObject<HTMLInputElement>
  'data-testid': string
}

export const CellInput = ({
  cellValue,
  setCellValue,
  fieldRef,
  'data-testid': dataTestId,
}: Props) => {
  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCellValue(event.target.value)
  }

  const setRef = (element: HTMLInputElement) => {
    if (fieldRef) {
      fieldRef.current = element
    }
  }

  return (
    <TextInput
      size={0}
      radius={0}
      border={false}
      ref={setRef}
      __unstable_disableFocusRing
      style={{
        padding: '22px 16px',
      }}
      value={cellValue}
      data-testid={dataTestId}
      onChange={handleOnChange}
    />
  )
}
