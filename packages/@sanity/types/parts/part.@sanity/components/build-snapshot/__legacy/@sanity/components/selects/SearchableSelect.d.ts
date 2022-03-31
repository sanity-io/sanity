import React from 'react'
declare type Item = unknown
interface SearchableSelectProps {
  label?: string
  description?: string
  onChange?: (item: Item) => void
  onSearch?: (inputValue: string) => void
  onOpen?: () => void
  onClose?: () => void
  onFocus?: () => void
  onClear?: () => void
  value?: Item
  inputValue?: string
  error?: boolean
  isLoading?: boolean
  renderItem: (item: Item) => React.ReactNode
  items?: Item[]
  dropdownPosition?: string
  readOnly?: boolean
}
interface State {
  inputValue: string
  isOpen: boolean
  highlightIndex: number
  isInputSelected: boolean
  hasFocus: boolean
}
export default class SearchableSelect extends React.PureComponent<
  SearchableSelectProps & Omit<React.HTMLProps<HTMLInputElement>, 'onChange' | 'onFocus' | 'value'>,
  State
> {
  static defaultProps: {
    placeholder: string
    isLoading: boolean
    onChange: () => any
    onSearch: () => any
    onOpen: () => any
    onClose: () => any
  }
  _rootElement: HTMLDivElement | null
  _input: HTMLInputElement | null
  constructor(props: SearchableSelectProps)
  UNSAFE_componentWillReceiveProps(nextProps: SearchableSelectProps): void
  handleChange: (item: any) => void
  handleOpen: () => void
  handleClose: () => void
  handleInputChange: (inputValue: any) => void
  handleHighlightIndexChange: (nextIndex: any) => void
  setRootElement: (element: HTMLDivElement | null) => void
  setInput: (input: HTMLInputElement | null) => void
  focus(): void
  handleFocus: (event: React.FocusEvent<HTMLInputElement>) => void
  handleBlur: (event: React.FocusEvent<HTMLInputElement>) => void
  render(): JSX.Element
}
export {}
