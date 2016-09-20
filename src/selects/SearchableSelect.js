import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/selects/searchable-style'
import {uniqueId} from 'lodash'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import DefaultList from 'part:@sanity/components/lists/default'
import Fuse from 'fuse.js'
import Spinner from 'part:@sanity/components/loading/spinner'

export default class SearchableSelect extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    onSearch: PropTypes.func,
    onOpen: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onClose: PropTypes.func,
    value: PropTypes.object,
    error: PropTypes.bool,
    placeholder: PropTypes.string,
    loading: PropTypes.bool,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
      })
    ),
  }

  static defaultProps = {
    placeholder: 'Type to search…',
    loading: false,
    onChange() {},
    onBlur() {},
    onSearch() {},
    onOpen() {},
    onClose() {}
  }

  constructor(props, context) {
    super(props, context)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.handleOpenList = this.handleOpenList.bind(this)
    this.handleCloseList = this.handleCloseList.bind(this)
    this.handleArrowClick = this.handleArrowClick.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)

    this.state = {
      hasFocus: false,
      searchResult: this.props.items || [],
      inputValue: this.props.value && this.props.value.title,
      inputSelected: false,
      arrowNavigationPosition: 0
    }
    const fuseOptions = {
      keys: ['title']
    }
    this.fuse = new Fuse(this.props.items, fuseOptions)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.items != this.props.items) {
      this.setState({
        searchResult: this.props.items,
        showList: true
      })
    }
    if (nextProps.value != this.props.value) {
      this.setState({
        inputValue: nextProps.value.title,
        inputSelected: true,
        value: nextProps.value.title,
        showList: false
      })
    }
  }

  handleFocus(event) {
    this.setState({
      hasFocus: true,
      inputSelected: true
    })

    this.props.onFocus(event)
  }

  handleBlur(event) {
    this.setState({
      hasFocus: false,
      inputSelected: false,
      showList: false
    })
    this.props.onBlur(event)
  }

  handleSelect(item) {
    this.setState({
      //value: item.title,
      searchResult: [],
      showList: false
    })
    this.props.onChange(item)
  }

  handleOpenList() {
    if (this.state.query) {
      this.setState({
        showList: true,
        searchResult: this.fuse.search(this.state.query)
      })
    } else {
      this.setState({
        showList: true,
        searchResult: this.props.items
      })
    }

    this.props.onOpen()
  }

  handleCloseList() {
    this.setState({
      showList: false
    })
    this.props.onClose()
  }

  handleArrowClick() {
    if (this.state.showList) {
      this.handleCloseList()
    } else {
      this.handleOpenList()
    }
  }

  handleInputChange(event) {
    const query = event.target.value

    // When no props.onSearch is given, search inside the items
    if (!this.props.onSearch(query) && this.props.items) {
      this.setState({
        searchResult: this.fuse.search(query),
        query: query,
        inputValue: query,
        showList: true,
        inputSelected: false
      })
    }
  }

  handleKeyDown(event) {
    const {arrowNavigationPosition, searchResult} = this.state
    if (searchResult) {
      if (event.key == 'ArrowUp' && arrowNavigationPosition > 0) {
        this.setState({
          arrowNavigationPosition: arrowNavigationPosition - 1,
          inputValue: searchResult[arrowNavigationPosition - 1].title,
          showList: true
        })
        return false
      }

      if (event.key == 'ArrowDown' && arrowNavigationPosition < searchResult.length - 1) {
        this.setState({
          arrowNavigationPosition: arrowNavigationPosition + 1,
          inputValue: searchResult[arrowNavigationPosition + 1].title,
          showList: true
        })
        return false
      }
    }
    return true
  }

  handleKeyUp(event) {
    const {arrowNavigationPosition, searchResult} = this.state
    if (event.key == 'Enter' && arrowNavigationPosition) {
      this.handleSelect(searchResult[arrowNavigationPosition])
      this.setState({
        hasFocus: false
      })
      return false
    }
    return true
  }

  componentWillMount() {
    this._inputId = uniqueId('SearchAbleSelect')
  }

  render() {
    const {label, error, placeholder, loading, value} = this.props
    const {hasFocus, searchResult, showList, arrowNavigationPosition} = this.state


    return (
      <DefaultFormField
        className={`${styles.root} ${hasFocus && styles.focused} ${error && styles.error}`}
        labelHtmlFor={this._inputId}
        label={label}
      >
        <div className={styles.selectContainer}>

          <DefaultTextInput
            className={styles.select}
            id={this._inputId}
            placeholder={placeholder}
            onChange={this.handleInputChange}
            onKeyDown={this.handleKeyDown}
            onKeyUp={this.handleKeyUp}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            value={this.state.inputValue}
            selected={this.state.inputSelected}
            hasFocus={this.state.hasFocus}
          />

          {loading && <div className={styles.spinner}><Spinner /></div>}
          {!loading && <div className={styles.icon} onClick={this.handleArrowClick}>
            <FaAngleDown color="inherit" />
          </div>}

        </div>

        <div className={`${showList > 0 ? styles.listContainer : styles.listContainerHidden}`}>
          {
            searchResult.length == 0 && <p className={styles.noResultText}>No result</p>
          }
          <DefaultList
            items={searchResult}
            scrollable
            selectedItem={(searchResult && searchResult[arrowNavigationPosition]) || value}
            onSelect={this.handleSelect}
          />
        </div>

      </DefaultFormField>
    )
  }
}
