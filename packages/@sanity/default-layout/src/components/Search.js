import React, {PropTypes} from 'react'
import GlobalSearch from 'part:@sanity/components/globalsearch/default'
import schema from 'part:@sanity/base/schema?'
import client from 'part:@sanity/base/client?'
import Preview from 'part:@sanity/base/preview?'
import locationStore from 'part:@sanity/base/location'
import {IntentLink} from 'part:@sanity/base/router'
import {union, flatten} from 'lodash'

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

  componentDidMount() {
    this.getTopItems()
  }

  handleSearch = q => {
    const params = {}

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

    const query = `* [(${union(searchableFields).join(', ')}) match "${q}", limit: 10]`

    this.setState({
      isSearching: true
    })

    client.fetch(query, params)
      .then(response => {
        this.setState({
          isSearching: false,
          isOpen: true,
          items: response
        })
      })

    this.setState({
      isOpen: true
    })
  }

  getTopItems = () => {
    // We use 3 last edited items until we have logic for most used etc.

    // TODO hack until gradient supports 'schemaName.*'
    const prefixedTypeNames = schema.getTypeNames().map(type => `${schema.name}.${type}`)

    const query = `(${prefixedTypeNames.join(', ')}) [order: _updatedAt desc, limit: 3]`

    client.fetch(query, {})
      .then(response => {
        this.setState({
          topItems: response
        })
      })
  }

  handleFocus = () => {
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
    // @TODO Hack for assuming desktool until we have a path resolver
    const type = item._type.split('.')[1]
    const id = item._id.split('/').join('.')
    const url = ['/desk', type, 'edit', id].join('/')

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
    const type = schema.get(item._type.split('.')[1])
    return (
      <IntentLink intent="edit" params={{id: item._id, type: type.name}}>
        <Preview
          value={item}
          view="default"
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
          topItems={this.state.topItems}
          items={this.state.items}
          placeholder="Search…"
        />
      </div>
    )
  }
}

export default Search
