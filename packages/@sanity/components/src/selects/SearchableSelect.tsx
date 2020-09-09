import PropTypes from 'prop-types'
import React from 'react'
import StatelessSearchableSelect from './StatelessSearchableSelect'

export default class SearchableSelect extends React.PureComponent {
  static propTypes = {
    label: PropTypes.string,
    description: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func,
    onSearch: PropTypes.func,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    onFocus: PropTypes.func,
    onClear: PropTypes.func,
    value: PropTypes.object,
    inputValue: PropTypes.string,
    error: PropTypes.bool,
    placeholder: PropTypes.string,
    isLoading: PropTypes.bool,
    renderItem: PropTypes.func.isRequired,
    items: PropTypes.array,
    dropdownPosition: PropTypes.string,
    readOnly: PropTypes.bool
  }

  static defaultProps = {
    placeholder: 'Type to search…',
    isLoading: false,
    onChange() {},
    onSearch() {},
    onOpen() {},
    onClose() {}
  }

  constructor(props) {
    super()
    const {inputValue} = props
    this.state = {
      inputValue: inputValue || '',
      isOpen: false,
      highlightIndex: -1,
      isInputSelected: false,
      hasFocus: false
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.items != this.props.items) {
      this.setState({
        searchResult: this.props.items
      })
    }

    if (nextProps.inputValue !== this.props.inputValue) {
      this.setState({
        inputValue: nextProps.inputValue
      })
    }
  }

  handleChange = item => {
    const {onChange} = this.props
    this.setState({
      isInputSelected: true
    })
    onChange(item)
    this.handleClose()
  }

  handleOpen = () => {
    this.setState({
      isOpen: true
    })
    this.props.onOpen()
  }

  handleClose = () => {
    this.setState({
      isOpen: false
    })
    this.props.onClose()
  }

  handleInputChange = inputValue => {
    this.setState({
      inputValue: inputValue,
      isInputSelected: false,
      isOpen: true
    })
    this.props.onSearch(inputValue)
  }

  handleHighlightIndexChange = nextIndex => {
    this.setState({highlightIndex: nextIndex})
  }

  setRootElement = element => {
    this._rootElement = element
  }

  setInput = input => {
    this._input = input
  }

  focus() {
    this._input.focus()
  }

  handleFocus = event => {
    const {onFocus} = this.props
    this.setState({
      hasFocus: true
    })
    if (onFocus) {
      onFocus()
    }
  }

  handleBlur = event => {
    this.setState({
      hasFocus: false,
      inputValue: this.props.inputValue
    })

    if (this.state.isOpen && this._rootElement.contains(event.relatedTarget)) {
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
          isSelected={hasFocus}
          ref={this.setInput}
          readOnly={readOnly}
        />
      </div>
    )
  }
}
