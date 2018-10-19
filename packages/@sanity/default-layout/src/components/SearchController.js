/* eslint-disable complexity */
import React from 'react'
import schema from 'part:@sanity/base/schema?'
import client from 'part:@sanity/base/client?'
import Preview from 'part:@sanity/base/preview?'
import {getPublishedId, isDraftId, getDraftId} from 'part:@sanity/base/util/draft-utils'
import {Subject} from 'rxjs'
import {IntentLink} from 'part:@sanity/base/router'
import {flow, compact, flatten, union} from 'lodash'
import Ink from 'react-ink'
import styles from './styles/Search.css'
import SearchWidget from './SearchWidget'
import {takeUntil, tap, debounceTime, map, switchMap} from 'rxjs/operators'

// Removes published documents that also has a draft
function removeDupes(documents) {
  const drafts = documents.map(doc => doc._id).filter(isDraftId)

  return documents.filter(doc => {
    const draftId = getDraftId(doc._id)
    const publishedId = getPublishedId(doc._id)
    const hasDraft = drafts.includes(draftId)
    const isPublished = doc._id === publishedId
    return isPublished ? !hasDraft : true
  })
}

const combineFields = flow([flatten, union, compact])

function search(query) {
  if (!client) {
    throw new Error('Sanity client is missing')
  }

  const candidateTypes = schema
    .getTypeNames()
    .filter(typeName => !typeName.startsWith('sanity.'))
    .map(typeName => schema.get(typeName))

  const terms = query.split(/\s+/).filter(Boolean)

  const params = terms.reduce((acc, term, i) => {
    acc[`t${i}`] = `${term}*`
    return acc
  }, {})

  const uniqueFields = combineFields(candidateTypes.map(type => type.__unstable_searchFields))
  const constraints = terms.map((term, i) => uniqueFields.map(field => `${field} match $t${i}`))
  const constraintString = constraints
    .map(constraint => `(${constraint.join(' || ')})`)
    .join(' && ')
  return client.observable.fetch(`*[${constraintString}][0...100]`, params)
}

class SearchController extends React.Component {
  input$ = new Subject()
  componentWillUnmount$ = new Subject()

  state = {
    isOpen: false,
    hits: [],
    activeIndex: -1,
    inputValue: ''
  }

  componentDidMount() {
    if (window) {
      window.addEventListener('keydown', this.handleWindowKeyDown)
    }

    this.input$
      .asObservable()
      .pipe(
        map(event => event.target.value),
        tap(inputValue => this.setState({inputValue})),
        takeUntil(this.componentWillUnmount$.asObservable())
      )
      .subscribe()

    this.input$
      .asObservable()
      .pipe(
        map(event => event.target.value),
        debounceTime(100),
        tap(() => {
          this.setState({
            isSearching: true
          })
        }),
        switchMap(search),
        // we need this filtering because the search may return documents of types not in schema
        map(hits => hits.filter(hit => schema.has(hit._type))),
        map(removeDupes),
        tap(hits => {
          this.setState({
            isSearching: false,
            hits: hits
          })
        }),
        takeUntil(this.componentWillUnmount$.asObservable())
      )
      .subscribe()
  }

  componentWillUnmount() {
    this.componentWillUnmount$.next()
    this.componentWillUnmount$.complete()
  }

  handleInputChange = event => {
    this.input$.next(event)
    this.setState({isOpen: true})
  }

  handleClose = event => {
    this.setState({
      isOpen: false
    })
  }

  handleOpen = event => {
    this.setState({
      isOpen: true
    })
  }

  handleHitMouseDown = ev => {
    this.setState({
      activeIndex: Number(ev.currentTarget.getAttribute('data-hit-index'))
    })
  }

  handleHitClick = event => {
    this.handleClose()
  }

  handleKeyDown = event => {
    const {isOpen, hits, activeIndex} = this.state
    const isArrowKey = ['ArrowUp', 'ArrowDown'].includes(event.key)

    if (event.key === 'Backspace') {
      //this.inputElement.focus()
    }
    if (event.key === 'Escape') {
      this.handleClose()
    }
    if (event.key === 'Enter') {
      this.listElement.querySelector(`[data-hit-index="${this.state.activeIndex}"]`).click()
    }

    if (!isOpen && isArrowKey) {
      this.handleOpen()
      return
    }

    const lastIndex = hits.length - 1
    if (isArrowKey) {
      event.preventDefault()
      let nextIndex = activeIndex + (event.key === 'ArrowUp' ? -1 : 1)
      if (nextIndex < 0) {
        nextIndex = lastIndex
      }
      if (nextIndex > lastIndex) {
        nextIndex = 0
      }
      this.setState({activeIndex: nextIndex})
    }
  }

  renderItem = (item, index, activeIndex) => {
    const type = schema.get(item._type)
    return (
      <IntentLink
        intent="edit"
        params={{id: item._id, type: type.name}}
        className={activeIndex === index ? styles.activeLink : styles.link}
        data-hit-index={index}
        onMouseDown={this.handleHitMouseDown}
        onMouseUp={this.handleHitMouseUp}
        onClick={this.handleHitClick}
        tabIndex={-1}
      >
        <div className={styles.itemType}>{type.title}</div>
        <Preview value={item} layout="default" type={type} />
        <Ink duration={200} opacity={0.1} radius={200} />
      </IntentLink>
    )
  }

  render() {
    const {isSearching, hits, isOpen, inputValue, activeIndex} = this.state
    return (
      <SearchWidget
        isSearching={isSearching}
        hits={hits}
        isOpen={isOpen}
        onOpen={this.handleOpen}
        onClose={this.handleClose}
        inputValue={inputValue}
        renderItem={this.renderItem}
        onInputChange={this.handleInputChange}
        onKeyDown={this.handleKeyDown}
        onKeyPress={this.handleKeyPress}
        onBlur={this.handleClose}
        onFocus={this.handleOpen}
        activeIndex={activeIndex}
      />
    )
  }
}

export default SearchController
