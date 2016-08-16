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
    value: PropTypes.string,
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
    value: '',
    placeholder: 'Type to search…',
    loading: false,
    onChange() {},
    onBlur() {},
    onSearch() {},
    onOpen() {}
  }

  constructor(props, context) {
    super(props, context)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.handleOpen = this.handleOpen.bind(this)
    this.state = {
      hasFocus: false,
      value: this.props.value || '',
      searchResult: this.props.items || []
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
  }

  handleFocus() {
    this.setState({
      hasFocus: true
    })
    this.props.onFocus()
  }

  handleBlur(event) {
    this.setState({
      hasFocus: false
    })
  }

  handleSelect(item) {
    this.setState({
      value: item.title,
      searchResult: [],
      showList: false
    })
    this.props.onChange(item)
  }

  handleOpen() {
    this.setState({
      showList: true,
      searchResult: this.fuse.search(this.state.value)
    })
    this.props.onOpen()
  }

  handleInputChange(event) {
    const value = event.target.value

    if (!this.props.onSearch(value) && this.props.items) {
      this.setState({
        searchResult: this.fuse.search(value),
        showList: true
      })
    }

  }

  componentWillMount() {
    this._inputId = lodash.uniqueId('SearchAbleSelect')
  }

  render() {
    const {label, error, placeholder, loading} = this.props
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
            value={this.state.value}
          />

        {
          loading && <div className={styles.spinner}><Spinner /></div>
        }
        {
          !loading && <div className={styles.icon} onClick={this.handleOpen}>
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
            onSelect={this.handleSelect}
          />
        </div>

      </DefaultFormField>
    )
  }
}
