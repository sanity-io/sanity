import PropTypes from 'prop-types'
import React from 'react'
import StatelessSearchableSelect from './StatelessSearchableSelect'
import tryFindScrollContainer from '../utilities/tryFindScrollContainer'

export default class SearchableSelect extends React.Component {
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
    scrollContainer: PropTypes.object
  }

  static defaultProps = {
    placeholder: 'Type to search…',
    isLoading: false,
    scrollContainer: undefined,
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
      width: 448
    }
  }

  componentDidMount() {
    const {
      scrollContainer
    } = this.props
    if (scrollContainer) {
      this.setScrollContainerElement(scrollContainer)
    } else {
      this.setScrollContainerElement(tryFindScrollContainer(this._rootElement))
    }
  }

  setScrollContainerElement = element => {
    this.setState({
      scrollContainer: element
    })
  }

  handleClickOutside = () => {
    this.setState({isOpen: false})
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
      isInputSelected: true,
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
    if (this._rootElement) {
      this.setState({
        width: this._rootElement.offsetWidth
      })
    }
  }

  render() {
    const {isOpen, highlightIndex, isInputSelected, inputValue, scrollContainer, width} = this.state
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
          scrollContainer={scrollContainer}
          width={width}
        />
      </div>
    )
  }
}
