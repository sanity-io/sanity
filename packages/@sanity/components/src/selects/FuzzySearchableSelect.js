import PropTypes from 'prop-types'
import React from 'react'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import Fuse from 'fuse.js'

export default class FuzzySearchableSelect extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.object,
    error: PropTypes.bool,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
      })
    ),
  }

  static defaultProps = {
    onChange() {},
    onBlur() {},
    onFocus() {}
  }

  constructor(props, context) {
    super(props, context)
    this.handleSearch = this.handleSearch.bind(this)

    const fuseOptions = {
      keys: ['title']
    }

    const {items} = this.props

    this.fuse = new Fuse(items, fuseOptions)

    this.state = {
      searchResult: [],
      query: null
    }
  }

  handleSearch(query) {
    this.setState({
      searchResult: this.fuse.search(query)
    })
  }

  render() {
    const {label, error, value, placeholder} = this.props
    const {searchResult, loading} = this.state

    return (
      <SearchableSelect
        error={error}
        label={label}
        placeholder={placeholder}
        value={value}
        onSearch={this.handleSearch}
        onChange={this.props.onChange}
        onFocus={this.props.onChange}
        loading={loading}
        items={searchResult}
      />
    )
  }
}
