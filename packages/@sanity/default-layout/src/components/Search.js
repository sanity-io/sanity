import React, {PropTypes} from 'react'
import GlobalSearch from 'part:@sanity/components/globalsearch/default'
import globalSearchStyles from 'part:@sanity/components/globalsearch/default-style'
import schema from 'part:@sanity/base/schema?'
import client from 'part:@sanity/base/client?'
import Preview from 'part:@sanity/base/preview?'
import locationStore from 'part:@sanity/base/location'
import {IntentLink} from 'part:@sanity/base/router'
import {union, flatten} from 'lodash'
import styles from './styles/Search.css'


class Search extends React.Component {

  static propTypes = {
    onSelect: PropTypes.func
  }

  static defaultProps = {
    onSelect() {}
  }

  constructor(props) {
    super(props)

    this.state = {
      isOpen: false,
      topItems: [],
      items: []
    }
  }

  handleSearch = q => {
    if (!client) {
      console.error('Sanity client is missing. (Search is disabled)') // eslint-disable-line
      return
    }

    // Get all fields that we want to search in (text and string)
    const searchableFields = flatten(
      schema.getTypeNames()
        .map(typeName => schema.get(typeName))
        .filter(type => type.type && type.type.name === 'object')
        .map(type => type.fields
            .filter(field => field.type.jsonType === 'string')
            .map(field => field.name)
          )
        )

    const uniqueFields = union(searchableFields)
    const constraints = uniqueFields.map(field => `${field} match $term`)
    const query = `*[${constraints.join(' || ')}][0...10]`

    this.setState({
      isSearching: true
    })

    client.fetch(query, {term: q})
      .then(hits => {
        this.setState({
          isSearching: false,
          isOpen: true,
          // we need this filtering because the search my return documents of types not in schema
          items: hits.filter(hit => schema.has(hit._type))
        })
      })

    this.setState({
      isOpen: true
    })
  }

  getTopItems = () => {
    // We use 3 last edited items until we have logic for most used etc.

    const prefixedTypeNames = schema.getTypeNames().map(str => `"${str}"`)

    const query = `*[_type in [${prefixedTypeNames.join(', ')}]] | order(_updatedAt desc) [0...3]`

    client.fetch(query, {})
      .then(response => {
        this.setState({
          topItems: response
        })
      })
  }

  handleFocus = () => {
    this.getTopItems()

    this.setState({
      active: true,
      isOpen: true
    })
  }
  handleClose = () => {
    this.setState({
      isOpen: false
    })
  }

  handleGoToItem = item => {
    const id = item._id
    const url = ['/desk', item._type, 'edit', id].join('/')

    locationStore.actions.navigate(url, {replace: false})

    this.setState({
      isOpen: false
    })
    this.props.onSelect()
  }

  handleBlur = () => {
    this.setState({
      isOpen: false
    })
  }

  renderItem = (item, options) => {
    const type = schema.get(item._type)
    return (
      <IntentLink intent="edit" params={{id: item._id, type: type.name}} className={globalSearchStyles.link}>
        <Preview
          value={item}
          layout="default"
          type={type}
        />
      </IntentLink>
    )
  }

  render() {

    if (!schema) {
      return <div>No schema</div>
    }

    return (
      <div>
        <GlobalSearch
          onSearch={this.handleSearch}
          isSearching={this.state.isSearching}
          onChange={this.handleGoToItem}
          onBlur={this.handleBlur}
          renderItem={this.renderItem}
          onFocus={this.handleFocus}
          onClose={this.handleClose}
          isOpen={this.state.isOpen}
          label="Search"
          items={(this.state.items.length > 0 && this.state.items) || this.state.topItems}
          placeholder="Search…"
          listContainerClassName={styles.listContainer}
        />
      </div>
    )
  }
}

export default Search
