import React from 'react'
import schema from 'part:@sanity/base/schema?'
import client from 'part:@sanity/base/client?'
import Preview from 'part:@sanity/base/preview?'
import {getPublishedId, isDraftId, getDraftId} from 'part:@sanity/base/util/draft-utils'
import {Subject} from 'rxjs'
import {takeUntil, tap, debounceTime, map, switchMap} from 'rxjs/operators'
import {IntentLink} from 'part:@sanity/base/router'
import {flow, compact, flatten, union} from 'lodash'
import SearchIcon from 'part:@sanity/base/search-icon'
import Spinner from 'part:@sanity/components/loading/spinner'
import enhanceClickOutside from 'react-click-outside'
import Ink from 'react-ink'
import styles from './styles/Search.css'

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
  return client.observable.fetch(`*[${constraintString}][0...10]`, params)
}

export default enhanceClickOutside(
  class Search extends React.Component {
    input$ = new Subject()
    componentWillUnmount$ = new Subject()

    state = {
      isOpen: false,
      hits: [],
      activeIndex: -1,
      inputValue: ''
    }

    componentDidMount() {
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
      this.open()
    }

    handleKeyPress = event => {
      this.inputElement.focus()
    }

    handleKeyDown = event => {
      if (event.key === 'Backspace') {
        this.inputElement.focus()
      }
      if (event.key === 'Escape') {
        this.close()
      }
      if (event.key === 'Enter') {
        this.listElement.querySelector(`[data-hit-index="${this.state.activeIndex}"]`).click()
      }
      const {isOpen, hits, activeIndex} = this.state

      const isArrowKey = ['ArrowUp', 'ArrowDown'].includes(event.key)

      if (!isOpen && isArrowKey) {
        this.open()
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
      if (this.state.isOpen) {
        this.close()
      }
    }

    handleHitClick = el => {
      this.close()
    }

    handleInputClick = el => {
      this.open()
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

    componentDidUpdate(prevProps, prevState) {
      if (!prevState.isOpen && this.state.isOpen) {
        this.inputElement.select()
      }
    }

    handleHitMouseDown = ev => {
      this.setState({
        activeIndex: Number(ev.currentTarget.getAttribute('data-hit-index'))
      })
    }

    handleHitMouseUp = () => {
      this.inputElement.focus()
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
      const {isSearching, hits, isOpen, inputValue} = this.state
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
              value={isOpen ? inputValue : ''}
              onInput={this.handleInputChange}
              onBlur={this.handleBlur}
              onClick={this.handleInputClick}
              onFocus={this.handleFocus}
              onKeyDown={this.handleKeyDown}
              placeholder="Search…"
              ref={this.setInput}
            />
          </div>
          {isOpen &&
            (inputValue || isSearching || hits > 0) && (
              <div className={styles.result}>
                <div className={styles.spinner}>{isSearching && <Spinner />}</div>
                {inputValue &&
                  !isSearching &&
                  (!hits || hits.length === 0) && (
                    <div className={styles.noHits}>
                      Could not find <strong>&ldquo;{inputValue}&rdquo;</strong>
                    </div>
                  )}
                {!isSearching &&
                  hits &&
                  hits.length > 0 && (
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
            )}
        </div>
      )
    }
  }
)
