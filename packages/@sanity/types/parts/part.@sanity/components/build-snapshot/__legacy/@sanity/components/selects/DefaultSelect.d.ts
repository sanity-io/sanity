import type React from 'react'
interface Item {
  title: string
}
interface DefaultSelectProps {
  onChange: (item: Item) => void
  value: Item
  hasError: boolean
  onFocus: () => void
  onBlur: () => void
  hasFocus: boolean
  disabled: boolean
  readOnly: boolean
  items: Item[]
}
export default class DefaultSelect extends React.Component<
  DefaultSelectProps & Omit<React.HTMLProps<HTMLSelectElement>, 'value'>
> {
  static defaultProps: {
    onChange: () => any
    onBlur: () => any
    onFocus: () => any
    readOnly: boolean
    hasError: boolean
    hasFocus: boolean
    value: {}
    items: any[]
  }
  _input: any
  handleChange: (event: any) => void
  focus(): void
  setInput: (el: any) => void
  render(): JSX.Element
}
export {}
