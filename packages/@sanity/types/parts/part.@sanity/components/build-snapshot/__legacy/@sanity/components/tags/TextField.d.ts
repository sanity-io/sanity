import type React from 'react'
interface TagsTextFieldProps {
  onChange: (value: string[]) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  readOnly?: boolean
  markers?: unknown[]
  value?: string[]
  inputId?: string
}
interface State {
  inputValue: string
}
export default class TagsTextField extends React.Component<
  TagsTextFieldProps & Omit<React.HTMLProps<HTMLInputElement>, 'onBlur' | 'onChange' | 'value'>,
  State
> {
  _input: HTMLInputElement | null
  state: State
  addTag(tagValue: string): void
  removeTag(index: number): void
  addAndClearInput(tagValue: string): void
  handleRemoveTagClick: (event: React.MouseEvent<HTMLAnchorElement>) => void
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  handleKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void
  handleBlur: (event: React.FocusEvent<HTMLInputElement>) => void
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  focus(): void
  setInput: (el: HTMLInputElement | null) => void
  render(): JSX.Element
}
export {}
