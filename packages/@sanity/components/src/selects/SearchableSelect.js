import PropTypes from 'prop-types'
import React from 'react'
import StatelessSearchableSelect from './StatelessSearchableSelect'

export default class SearchableSelect extends React.PureComponent {
  static propTypes = {
    label: PropTypes.string,
    description: PropTypes.string,
    onChange: PropTypes.func,
    onSearch: PropTypes.func,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    onClear: PropTypes.func,
    value: PropTypes.object,
    inputValue: PropTypes.string,
    error: PropTypes.bool,
    placeholder: PropTypes.string,
    isLoading: PropTypes.bool,
    renderItem: PropTypes.func.isRequired,
    items: PropTypes.array,
    dropdownPosition: PropTypes.string
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
      arrowNavigationPosition: 0,
      hasFocus: false
    }
  }

  componentWillReceiveProps(nextProps) {
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
    this.setState({
      hasFocus: true
    })
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
    const {onSearch, ...rest} = this.props
    return (
      <div ref={this.setRootElement}>
        <StatelessSearchableSelect
          {...rest}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          onHighlightIndexChange={this.handleHighlightIndexChange}
          onOpen={this.handleOpen}
          onClose={this.handleClose}
          onChange={this.handleChange}
          isOpen={isOpen}
          highlightIndex={highlightIndex}
          isInputSelected={isInputSelected}
          inputValue={inputValue}
          onInputChange={this.handleInputChange}
          isSelected={hasFocus}
          ref={this.setInput}
        />
      </div>
    )
  }
}
