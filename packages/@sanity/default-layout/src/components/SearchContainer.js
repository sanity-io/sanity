// import {isKeyHotkey} from 'is-hotkey'
import PropTypes from 'prop-types'
import React from 'react'
import schema from 'part:@sanity/base/schema?'
import client from 'part:@sanity/base/client?'
import Preview from 'part:@sanity/base/preview?'
import {joinPath} from 'part:@sanity/base/util/search-utils'
import {getPublishedId, isDraftId, getDraftId} from 'part:@sanity/base/util/draft-utils'
import {Subject, of} from 'rxjs'
import {IntentLink} from 'part:@sanity/base/router'
import {flow, compact, flatten, union, uniq} from 'lodash'
import Ink from 'react-ink'
import SearchField from './SearchField'
import SearchResults from './SearchResults'
import {filter, takeUntil, tap, debounceTime, map, switchMap, catchError} from 'rxjs/operators'

import resultsStyles from './styles/SearchResults.css'

// NOTE: Remove until we know what hotkey to use
// const hotKeys = {
//   openSearch: isKeyHotkey('ctrl+t')
// }

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

function isGroq(query) {
  if (!query) {
    return false
  }
  return query.startsWith('*[') && query.endsWith(']')
}

const combineFields = flow([flatten, union, compact])

const UNSAFE_GROQ_FIELDS = ['match', 'in', 'asc', 'desc', 'true', 'false', 'null']

const searchPreviewFields = ['title', 'subtitle', 'description']

function getFieldsFromPreviewField(candidateTypes) {
  return uniq(
    candidateTypes
      .filter(type => type.preview)
      .filter(type => type.preview.select)
      .map(type => Object.values(type.preview.select))
      .reduce((acc, x) => acc.concat(x), [])
      .filter(titleField => titleField.indexOf('.') === -1)
      .map(field => {
        if (UNSAFE_GROQ_FIELDS.indexOf(field) === -1) return field
        return `"${field}":@["${field}"]`
      })
  )
}

function search(query) {
  if (!client) {
    throw new Error('Sanity client is missing')
  }

  const candidateTypes = schema
    .getTypeNames()
    .filter(typeName => !typeName.startsWith('sanity.'))
    .map(typeName => schema.get(typeName))

  // const titleFields = candidateTypes
  //   .filter(type => type.preview)
  //   .map(type => type.preview.select)
  //   .map(select => select || {title: 'title'})
  //   .map(select => select.title || 'title')
  //   .filter(titleField => titleField.indexOf('.') === -1)
  //   .map(titleField => {
  //     if (UNSAFE_GROQ_FIELDS.indexOf(titleField) === -1) return titleField
  //     return `"${titleField}":@["${titleField}"]`
  //   })

  if (isGroq(query)) {
    //console.log('GROQ', query)
    return client.observable.fetch(`${query}[0...100]`).pipe(
      map(data => ({error: null, data})),
      catchError(error => {
        // console.log(error)
        return of({error, data: null})
      })
    )
  }

  const previewFields = getFieldsFromPreviewField(candidateTypes)

  const terms = query.split(/\s+/).filter(Boolean)

  const params = terms.reduce((acc, term, i) => {
    acc[`t${i}`] = `${term}*`
    return acc
  }, {})

  const uniqueFields = combineFields(
    candidateTypes.map(type => (type.__unstable_searchFields || []).map(joinPath))
  )
  const constraints = terms.map((term, i) =>
    uniqueFields.map(joinedPath => `${joinedPath} match $t${i}`)
  )
  const constraintString = constraints.map(constraint => `(${constraint.join('||')})`).join('&&')
  return client.observable
    .fetch(`*[${constraintString}][0...100]{_id,_type,${previewFields.join(',')}}`, params)
    .pipe(
      map(data => ({error: null, data})),
      catchError(error => {
        // console.log(error)
        return of({error, data: null})
      })
    )
}

class SearchContainer extends React.PureComponent {
  static propTypes = {
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    shouldBeFocused: PropTypes.bool.isRequired
  }

  input$ = new Subject()
  componentWillUnmount$ = new Subject()
  fieldInstance = null
  resultsInstance = null

  state = {
    activeIndex: -1,
    error: false,
    isBleeding: true, // mobile first
    isFocused: false,
    isLoading: false,
    isPressing: false,
    results: [],
    value: ''
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleWindowKeyDown)
    window.addEventListener('mouseup', this.handleWindowMouseUp)
    window.addEventListener('resize', this.handleWindowResize)

    this.input$
      .asObservable()
      .pipe(
        map(event => event.target.value),
        tap(value => this.setState({activeIndex: -1, value, error: false})),
        takeUntil(this.componentWillUnmount$.asObservable())
      )
      .subscribe()

    this.input$
      .asObservable()
      .pipe(
        map(event => event.target.value),
        filter(value => value.length === 0),
        tap(() => {
          this.setState({results: [], error: false})
        })
      )
      .subscribe()

    const result$ = this.input$.asObservable().pipe(
      map(event => event.target.value),
      filter(value => value.length > 0),
      tap(() => {
        this.setState({
          isLoading: true,
          error: false
        })
      }),
      debounceTime(100),
      switchMap(search)
    )

    const hits$ = result$.pipe(
      filter(result => result.data),
      map(result => result.data)
    )
    const error$ = result$.pipe(
      filter(result => result.error),
      map(result => result.error)
    )

    hits$
      .pipe(
        // we need this filtering because the search may return documents of types not in schema
        map(hits => hits.filter(hit => schema.has(hit._type))),
        map(removeDupes),
        tap(results => {
          this.setState({
            isLoading: false,
            error: false,
            results
          })
        }),
        takeUntil(this.componentWillUnmount$.asObservable())
      )
      .subscribe()

    error$.subscribe({
      next: error => {
        this.setState({
          error: true,
          isLoading: false,
          results: []
        })
      }
    })

    // trigger initial resize
    this.handleWindowResize()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.shouldBeFocused && this.props.shouldBeFocused) {
      this.fieldInstance.inputElement.select()
    }
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.handleWindowMouseUp)
    window.removeEventListener('keydown', this.handleWindowKeyDown)
    window.removeEventListener('resize', this.handleWindowResize)

    this.componentWillUnmount$.next()
    this.componentWillUnmount$.complete()
  }

  handleInputChange = event => {
    this.input$.next(event)
  }

  handleBlur = () => {
    if (!this.state.isPressing) {
      this.props.onClose()
      this.setState({isFocused: false})
    }
  }

  handleFocus = () => {
    this.props.onOpen()
    this.setState({isFocused: true})
  }

  handleHitMouseDown = event => {
    this.setState({
      activeIndex: Number(event.currentTarget.getAttribute('data-hit-index'))
    })
  }

  handleHitClick = event => {
    this.handleClear()
  }

  handleClear = () => {
    this.props.onClose()
    this.setState({isFocused: false, value: '', results: [], error: false})
  }

  /* eslint-disable-next-line complexity */
  handleKeyDown = event => {
    const {results, activeIndex} = this.state
    const isArrowKey = ['ArrowUp', 'ArrowDown'].includes(event.key)
    const lastIndex = results.length - 1

    if (event.key === 'Enter') {
      this.resultsInstance.element.querySelector(`[data-hit-index="${activeIndex}"]`).click()
    }

    if (event.key === 'Escape') {
      // this.handleClear()
      this.fieldInstance.inputElement.blur()
    }

    // TODO: is it safe to remove this?
    // if (!isFocused && isArrowKey) {
    //   this.handleFocus()
    //   return
    // }

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

  handleMouseDown = () => {
    this.setState({isPressing: true})
  }

  handleWindowKeyDown = event => {
    // if (hotKeys.openSearch(event)) {
    //   this.fieldInstance.inputElement.focus()
    //   event.preventDefault()
    //   event.stopPropagation()
    // }
  }

  handleWindowResize = () => {
    const isBleeding = !window.matchMedia('all and (min-width: 32em)').matches

    this.setState({isBleeding})
  }

  handleWindowMouseUp = () => {
    this.setState({isPressing: false})
  }

  setFieldInstance = ref => {
    this.fieldInstance = ref
  }

  setResultsInstance = ref => {
    this.resultsInstance = ref
  }

  renderItem = (item, index, className) => {
    const type = schema.get(item._type)
    return (
      <IntentLink
        className={className}
        intent="edit"
        params={{id: item._id, type: type.name}}
        data-hit-index={index}
        onMouseDown={this.handleHitMouseDown}
        onClick={this.handleHitClick}
        tabIndex={-1}
      >
        <Preview
          value={item}
          layout="default"
          type={type}
          status={<div className={resultsStyles.itemType}>{type.title}</div>}
        />
        <Ink duration={200} opacity={0.1} radius={200} />
      </IntentLink>
    )
  }

  renderResults() {
    const {activeIndex, isBleeding, isLoading, results, value, error} = this.state
    if (error) {
      return <div style={{color: 'red'}}>GROQ error</div>
    }

    return (
      <SearchResults
        activeIndex={activeIndex}
        isBleeding={isBleeding}
        isLoading={isLoading}
        items={results}
        query={value}
        renderItem={this.renderItem}
        ref={this.setResultsInstance}
      />
    )
  }

  render() {
    const {isBleeding, isFocused, isLoading, value} = this.state
    const isOpen = isFocused && value.length > 0
    return (
      <SearchField
        isBleeding={isBleeding}
        isFocused={isFocused}
        isLoading={isLoading}
        isOpen={isOpen}
        onBlur={this.handleBlur}
        onChange={this.handleInputChange}
        onClear={this.handleClear}
        onFocus={this.handleFocus}
        onKeyDown={this.handleKeyDown}
        onMouseDown={this.handleMouseDown}
        ref={this.setFieldInstance}
        results={this.renderResults()}
        value={value}
      />
    )
  }
}

export default SearchContainer
