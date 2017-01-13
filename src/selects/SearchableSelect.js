import React, {PropTypes} from 'react'
import StatelessSearchableSelect from './StatelessSearchableSelect'

export default class SearchableSelect extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    onChange: PropTypes.func,
    onSearch: PropTypes.func,
    onOpen: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onClose: PropTypes.func,
    onClear: PropTypes.func,
    value: PropTypes.object,
    valueToString: PropTypes.func,
    error: PropTypes.bool,
    placeholder: PropTypes.string,
    isLoading: PropTypes.bool,
    renderItem: PropTypes.func,
    items: PropTypes.array,
  }

  static defaultProps = {
    placeholder: 'Type to search…',
    isLoading: false,
    onChange() {},
    onBlur() {},
    onFocus() {},
    onSearch() {},
    valueToString: value => value,
    onOpen() {},
    onClose() {}
  }


  constructor(props) {
    super()
    const {value, valueToString} = props
    this.state = {
      inputValue: value ? valueToString(value) : null,
      hasFocus: false,
      isOpen: false,
      highlightIndex: -1,
      isInputSelected: false,
      arrowNavigationPosition: 0
    }
  }

  handleClickOutside = () => {
    this.setState({isOpen: false})
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.items != this.props.items) {
      this.setState({
        searchResult: this.props.items,
        isOpen: true
      })
    }
    if (nextProps.value != this.props.value) {
      this.setState({
        inputValue: nextProps.valueToString(nextProps.value),
        isInputSelected: true,
        isOpen: false
      })
    }
  }

  handleFocus = event => {
    this.setState({
      hasFocus: true,
      isInputSelected: true
    })

    this.open()
    this.props.onFocus(event)
  }

  handleBlur = event => {
    const {valueToString, value} = this.props
    this.setState({
      inputValue: value ? valueToString(value) : null,
      hasFocus: false,
    })
    this.close()
    this.props.onBlur(event)
  }

  handleChange = item => {
    const {onChange, valueToString} = this.props
    this.setState({
      inputValue: item ? valueToString(item) : null,
    })
    onChange(item)
    this.close()
  }

  open = () => {
    this.setState({
      isOpen: true,
    })
    this.props.onOpen()
  }

  close = () => {
    this.setState({
      isOpen: false,
      hasFocus: false
    })
    this.props.onClose()
  }

  handleOpen = () => {
    this.open()
  }
  handleClose = () => {
    this.close()
  }

  handleInputChange = inputValue => {
    this.setState({
      inputValue: inputValue,
      isInputSelected: false
    })
    this.props.onSearch(inputValue)
  }

  handleHighlightIndexChange = nextIndex => {
    this.setState({highlightIndex: nextIndex})
  }

  render() {
    const {hasFocus, isOpen, highlightIndex, isInputSelected, inputValue} = this.state

    return (
      <StatelessSearchableSelect
        {...this.props}
        hasFocus={hasFocus}
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
      />
    )
  }
}
