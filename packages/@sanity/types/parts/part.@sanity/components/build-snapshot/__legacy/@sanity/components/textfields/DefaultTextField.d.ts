import type React from 'react'
interface DefaultTextFieldProps {
  label: string
  id?: string
  type?: string
  onChange?: () => void
  onFocus?: () => void
  onBlur?: () => void
  onClear?: () => void
  onKeyPress?: () => void
  value?: string | number
  hasError?: boolean
  level?: number
  placeholder?: string
  isClearable?: boolean
  className?: string
  description?: string
}
export default class DefaultTextField extends React.Component<DefaultTextFieldProps> {
  _inputId?: string
  handleClear: () => void
  UNSAFE_componentWillMount(): void
  render(): JSX.Element
}
export {}
