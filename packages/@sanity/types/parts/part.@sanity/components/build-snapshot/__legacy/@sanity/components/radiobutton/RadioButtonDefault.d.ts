import React from 'react'
declare type Props = {
  label: string
  item: Record<string, unknown>
  onChange?: (item: Record<string, unknown>) => void
  onFocus?: (evt: React.FocusEvent<HTMLInputElement>) => void
  checked: boolean
  disabled?: boolean
  name?: string
}
export default function RadioButton({
  item,
  disabled,
  checked,
  label,
  name,
  onChange,
  onFocus,
}: Props): JSX.Element
export {}
