import React from 'react'
interface RadioSelectProps {
  name?: string
  direction: 'horizontal' | 'vertical'
  onFocus?: (evt: React.FocusEvent<HTMLInputElement>) => void
  onChange?: (val: any) => void
  value: any
  readOnly?: boolean
  items: {
    title: string
  }[]
  inputId?: string
}
declare const RadioSelect: React.ForwardRefExoticComponent<
  RadioSelectProps & React.RefAttributes<HTMLDivElement>
>
export default RadioSelect
