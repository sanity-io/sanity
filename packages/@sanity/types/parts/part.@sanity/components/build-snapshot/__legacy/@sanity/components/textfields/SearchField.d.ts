import React from 'react'
interface SearchFieldFieldProps {
  label: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus?: () => void
  onBlur?: () => void
  placeholder?: string
  value?: string
}
export default class SearchFieldField extends React.Component<SearchFieldFieldProps> {
  _inputId: string
  handleKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void
  render(): JSX.Element
}
export {}
