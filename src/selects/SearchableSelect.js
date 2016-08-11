import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/selects/searchable'
import lodash from 'lodash'
import {FaAngleDown} from 'react-icons/lib/fa'
import DefaultFormField from 'component:@sanity/components/formfields/default'
import DefaultTextInput from 'component:@sanity/components/textinputs/default'
import DefaultList from 'component:@sanity/components/lists/default'
import Fuse from 'fuse.js'

export default class SearchableSelect extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    value: PropTypes.string,
    error: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    showClearButton: PropTypes.bool,
    placeholder: PropTypes.string,
    onSearch: PropTypes.func,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
      })
    ),
  }

  static defaultProps = {
    value: '',
    placeholder: 'Type to search…',
    onChange() {},
    onBlur() {},
    onSearch() {},
  }

  constructor(props, context) {
    super(props, context)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.state = {
      hasFocus: false,
      value: this.props.value || '',
      suggestions: []
    }
    const fuseOptions = {
      keys: ['title']
    }
    this.fuse = new Fuse(this.props.items, fuseOptions)
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
      suggestions: [],
      showList: false
    })
    this.props.onChange(item)
  }

  handleInputChange(event) {
    const value = event.target.value
    this.setState({
      suggestions: this.fuse.search(value),
      showList: true
    })

    return value
  }

  componentWillMount() {
    this._inputId = lodash.uniqueId('SearchAbleSelect')
  }

  render() {
    const {label, error, placeholder} = this.props
    const {hasFocus, suggestions, showList} = this.state

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

          <div className={styles.icon}>
            <FaAngleDown color="inherit" />
          </div>

        </div>

        <div className={`${showList > 0 ? styles.listContainer : styles.listContainerHidden}`}>
          {
            suggestions.length == 0 && <p>No result</p>
          }
          <DefaultList
            items={suggestions}
            onSelect={this.handleSelect}
          />
        </div>

      </DefaultFormField>
    )
  }
}
