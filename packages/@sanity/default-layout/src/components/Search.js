import React from 'react'
import schema from 'part:@sanity/base/schema?'
import client from 'part:@sanity/base/client?'
import Preview from 'part:@sanity/base/preview?'
import Multicast from '@sanity/observable/multicast'
import {IntentLink} from 'part:@sanity/base/router'
import {union, flatten} from 'lodash'
import SearchIcon from 'part:@sanity/base/search-icon'
import Spinner from 'part:@sanity/components/loading/spinner'
import enhanceClickOutside from 'react-click-outside'

function isParentOf(possibleParent, possibleChild) {
  let current = possibleChild
  while (current) {
    if (current === possibleParent) {
      return true
    }
    current = current.parentNode
  }
  return false
}

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

function search(query) {
  if (!client) {
    throw new Error('Sanity client is missing')
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

  const terms = query.split(/\s+/)
  const uniqueFields = union(searchableFields)
  const constraints = flatten(uniqueFields.map(field => terms.map(term => `${field} match '${term}**'`)))

  return client.observable.fetch(`*[${constraints.join(' || ')}][0...10]`)
}


export default enhanceClickOutside(class Search extends React.Component {
  input$ = new Multicast()
  componentWillUnmount$ = new Multicast()

  state = {
    isOpen: false,
    hits: [],
    activeIndex: -1
  }

  componentDidMount() {
    this.input$.asObservable()
      .map(event => event.target.value)
      .debounceTime(100)
      .do(() => {
        this.setState({
          isSearching: true
        })
      })
      .switchMap(search)
      // we need this filtering because the search may return documents of types not in schema
      .map(hits => hits.filter(hit => schema.has(hit._type)))
      .map(removeDupes)
      .do(hits => {
        this.setState({
          isSearching: false,
          hits: hits
        })
      })
      .takeUntil(this.componentWillUnmount$.asObservable())
      .subscribe()
  }

  componentWillUnmount() {
    this.componentWillUnmount$.next()
    this.componentWillUnmount$.complete()
  }

  handleInputChange = event => {
    this.input$.next(event)
  }

  handleKeyPress = event => {
    this.inputElement.focus()
  }

  handleKeyDown = event => {
    if (event.key === 'Backspace') {
      this.inputElement.focus()
    }
    if (event.key === 'Enter') {
      this.listElement.querySelector(`[data-hit-index="${this.state.activeIndex}"]`).click()
    }
    const {hits, activeIndex} = this.state
    const lastIndex = hits.length - 1
    if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
      let nextIndex = activeIndex + (event.key === 'ArrowUp' ? - 1 : 1)
      if (nextIndex < 0) nextIndex = lastIndex
      if (nextIndex > lastIndex) nextIndex = 0
      this.setState({activeIndex: nextIndex})
    }
  }

  close() {
    this.setOpen(false)
  }

  open() {
    this.setOpen(true)
  }

  setOpen(isOpen) {
    this.setState({isOpen})
  }

  handleClickOutside = el => {
    this.close()
  }

  handleFocus = el => {
    this.open()
  }

  handleBlur = el => {
    if (!isParentOf(this.rootElement, el.relatedTarget)) {
      this.close()
    }
  }

  setInput = el => {
    this.inputElement = el
  }

  setListElement = el => {
    this.listElement = el
  }

  setRootElement = el => {
    this.rootElement = el
  }

  renderItem = (item, index) => {
    const type = schema.get(item._type)
    const {activeIndex} = this.state
    return (
      <IntentLink
        intent="edit"
        params={{id: item._id, type: type.name}}
        className={activeIndex === index ? styles.activeLink : styles.link}
        data-hit-index={index}
      >
        <Preview
          value={item}
          layout="default"
          type={type}
        />
      </IntentLink>
    )
  }

  render() {
    const {isSearching, hits, isOpen} = this.state
    return (
      <div className={styles.root} ref={this.setRootElement}>
        <div className={styles.inner}>
          <label className={styles.label}>
            <i className={styles.icon} aria-hidden>
              <SearchIcon />
            </i>
          </label>
          <input
            className={styles.input}
            type="search"
            onInput={this.handleInputChange}
            onBlur={this.handleBlur}
            onFocus={this.handleFocus}
            onKeyDown={this.handleKeyDown}
            placeholder="Search…"
            ref={this.setInput}

          />
          <div className={styles.spinner}>
            {isSearching && <Spinner />}
          </div>
        </div>
        {isOpen && (
          <div className={styles.listContainer}>
            <ul
              className={styles.hits}
              onKeyDown={this.handleKeyDown}
              onKeyPress={this.handleKeyPress}
              ref={this.setListElement}
            >
              {hits.map((hit, index) => (
               <li key={hit._id} className={styles.hit}>
                 {this.renderItem(hit, index)}
               </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
})
