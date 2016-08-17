import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/selects/searchable'
import lodash from 'lodash'
import {FaAngleDown} from 'react-icons/lib/fa'
import DefaultFormField from 'component:@sanity/components/formfields/default'
import DefaultTextInput from 'component:@sanity/components/textinputs/default'
import DefaultList from 'component:@sanity/components/lists/default'
import Fuse from 'fuse.js'
import Spinner from 'component:@sanity/components/loading/spinner'

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
    this.state = {
      hasFocus: false,
      searchResult: this.props.items || [],
      inputValue: this.props.value && this.props.value.title,
      inputSelected: false
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
      inputSelected: false
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

  componentWillMount() {
    this._inputId = lodash.uniqueId('SearchAbleSelect')
  }

  render() {
    const {label, error, placeholder, loading, value} = this.props
    const {hasFocus, searchResult, showList} = this.state


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
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            value={this.state.inputValue}
            selected={this.state.inputSelected}
            hasFocus={this.state.hasFocus}
          />

        {
          loading && <div className={styles.spinner}><Spinner /></div>
        }
        {
          !loading && <div className={styles.icon} onClick={this.handleArrowClick}>
            <FaAngleDown color="inherit" />
          </div>
        }

        </div>

        <div className={`${showList > 0 ? styles.listContainer : styles.listContainerHidden}`}>
          {
            searchResult.length == 0 && <p className={styles.noResultText}>No result</p>
          }
          <DefaultList
            items={searchResult}
            selectedItem={value}
            onSelect={this.handleSelect}
          />
        </div>

      </DefaultFormField>
    )
  }
}
