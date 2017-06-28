import PropTypes from 'prop-types'
import React from 'react'
import GlobalSearch from 'part:@sanity/components/globalsearch/default'
import globalSearchStyles from 'part:@sanity/components/globalsearch/default-style'
import schema from 'part:@sanity/base/schema?'
import client from 'part:@sanity/base/client?'
import Preview from 'part:@sanity/base/preview?'
import {IntentLink} from 'part:@sanity/base/router'
import {union, flatten} from 'lodash'
import styles from './styles/Search.css'


export const DRAFTS_FOLDER = 'drafts'
const DRAFTS_PREFIX = `${DRAFTS_FOLDER}.`

function isDraftId(id) {
  return id.startsWith(DRAFTS_PREFIX)
}

function getPublishedId(id) {
  return isDraftId(id) ? id.slice(DRAFTS_PREFIX.length) : id
}

function getDraftId(id) {
  return isDraftId(id) ? id : DRAFTS_PREFIX + id
}

// Removes published documents that also has a draft
function removeDupes(documents) {
  const drafts = documents.map(doc => doc._id).filter(isDraftId)

  return documents
    .filter(doc => {
      const draftId = getDraftId(doc._id)
      const publishedId = getPublishedId(doc._id)
      const hasDraft = drafts.includes(draftId)
      const isPublished = doc._id === publishedId
      return isPublished ? !hasDraft : true
    })
}


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

    const terms = q.split(/\s+/)
    const uniqueFields = union(searchableFields)
    const constraints = flatten(
      uniqueFields.map(field => terms.map(term => `${field} match '${term}*'`)
    ))
    const query = `*[${constraints.join(' || ')}][0...10]`

    this.setState({
      isSearching: true
    })

    client.fetch(query)
      .then(removeDupes)
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
