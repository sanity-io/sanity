import React from 'react'
import StatelessSearchableSelect from './StatelessSearchableSelect'

type Item = unknown

interface SearchableSelectProps {
  label?: string
  description?: string
  // className?: string
  onChange?: (item: Item) => void
  onSearch?: (inputValue: string) => void
  onOpen?: () => void
  onClose?: () => void
  onFocus?: () => void
  onClear?: () => void
  value?: Item
  inputValue?: string
  error?: boolean
  // placeholder?: string
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
  // searchResult: any[]
}

export default class SearchableSelect extends React.PureComponent<
  SearchableSelectProps & Omit<React.HTMLProps<HTMLInputElement>, 'onChange' | 'onFocus' | 'value'>,
  State
> {
  static defaultProps = {
    placeholder: 'Type to search…',
    isLoading: false,
    onChange: () => undefined,
    onSearch: () => undefined,
    onOpen: () => undefined,
    onClose: () => undefined
  }

  _rootElement: HTMLDivElement | null = null
  _input: HTMLInputElement | null = null

  constructor(props: SearchableSelectProps) {
    super(props)

    const {inputValue} = props

    this.state = {
      inputValue: inputValue || '',
      isOpen: false,
      highlightIndex: -1,
      isInputSelected: false,
      hasFocus: false
      // searchResult: []
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps: SearchableSelectProps) {
    // if (nextProps.items != this.props.items) {
    //   this.setState({
    //     searchResult: this.props.items || []
    //   })
    // }

    if (nextProps.inputValue !== this.props.inputValue) {
      this.setState({
        inputValue: nextProps.inputValue || ''
      })
    }
  }

  handleChange = item => {
    const {onChange} = this.props
    this.setState({
      isInputSelected: true
    })
    if (onChange) onChange(item)
    this.handleClose()
  }

  handleOpen = () => {
    this.setState({
      isOpen: true
    })
    if (this.props.onOpen) this.props.onOpen()
  }

  handleClose = () => {
    this.setState({
      isOpen: false
    })
    if (this.props.onClose) this.props.onClose()
  }

  handleInputChange = inputValue => {
    this.setState({
      inputValue: inputValue,
      isInputSelected: false,
      isOpen: true
    })
    if (this.props.onSearch) this.props.onSearch(inputValue)
  }

  handleHighlightIndexChange = nextIndex => {
    this.setState({highlightIndex: nextIndex})
  }

  setRootElement = (element: HTMLDivElement | null) => {
    this._rootElement = element
  }

  setInput = (input: HTMLInputElement | null) => {
    this._input = input
  }

  focus() {
    if (this._input) this._input.focus()
  }

  handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const {onFocus} = this.props
    this.setState({
      hasFocus: true
    })
    if (onFocus) {
      onFocus()
    }
  }

  handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    this.setState({
      hasFocus: false,
      inputValue: this.props.inputValue || ''
    })

    if (
      this.state.isOpen &&
      this._rootElement &&
      this._rootElement.contains(event.relatedTarget as Node | null)
    ) {
      this.setState({
        isOpen: false
      })
    }
  }

  render() {
    const {isOpen, highlightIndex, isInputSelected, inputValue, hasFocus} = this.state
    const {onSearch, className, readOnly, placeholder, ...rest} = this.props

    const changeHandlers = readOnly
      ? {}
      : {
          onInputChange: this.handleInputChange,
          onChange: this.handleChange
        }

    return (
      <div ref={this.setRootElement} className={className}>
        <StatelessSearchableSelect
          {...rest}
          {...changeHandlers}
          placeholder={placeholder}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          onHighlightIndexChange={this.handleHighlightIndexChange}
          onOpen={this.handleOpen}
          onClose={this.handleClose}
          isOpen={isOpen}
          highlightIndex={highlightIndex}
          isInputSelected={isInputSelected}
          inputValue={inputValue}
          ref={this.setInput as any}
          readOnly={readOnly}
        />
      </div>
    )
  }
}
