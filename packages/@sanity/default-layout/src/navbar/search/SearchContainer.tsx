import {isKeyHotkey} from 'is-hotkey'
import PropTypes from 'prop-types'
import React from 'react'
import schema from 'part:@sanity/base/schema?'
import Preview from 'part:@sanity/base/preview?'
import {concat, of, Subject, timer} from 'rxjs'
import {
  distinctUntilChanged,
  catchError,
  map,
  mergeMapTo,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import {IntentLink} from 'part:@sanity/base/router'
import search from 'part:@sanity/base/search'
import SearchField from './SearchField'
import SearchResults from './SearchResults'
import {ResultItem} from './types'

import resultsStyles from './SearchResults.css'

const hotKeys = {
  // NOTE: Remove until we know what hotkey to use
  // openSearch: isKeyHotkey('ctrl+t'),
  debugSearch: isKeyHotkey('ctrl+shift+d'),
}

const searchOrEmpty = (queryStr: string) => {
  return queryStr === '' ? of([]) : search(queryStr)
}

interface Props {
  onClose: () => void
  onOpen: () => void
  shouldBeFocused: boolean
}

interface State {
  activeIndex: number
  error: Error | null
  isBleeding: boolean // mobile first
  isFocused: boolean
  isLoading: boolean
  isPressing: boolean
  results: ResultItem[]
  value: string
  isDebug: boolean
}

class SearchContainer extends React.PureComponent<Props, State> {
  static propTypes = {
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    shouldBeFocused: PropTypes.bool.isRequired,
  }
  fieldRef: React.RefObject<SearchField> = React.createRef()
  resultsRef: React.RefObject<SearchResults> = React.createRef()

  searchTerm$: Subject<string> = new Subject()
  componentWillUnmount$: Subject<{}> = new Subject()

  state = {
    activeIndex: -1,
    error: null,
    isBleeding: true, // mobile first
    isFocused: false,
    isLoading: false,
    isPressing: false,
    results: [],
    value: '',
    isDebug: false,
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleWindowKeyDown)
    window.addEventListener('mouseup', this.handleWindowMouseUp)
    window.addEventListener('resize', this.handleWindowResize)

    this.searchTerm$
      .pipe(
        distinctUntilChanged(),
        switchMap((queryStr: string) =>
          concat(
            of({activeIndex: -1, error: null, value: queryStr, isLoading: true}),
            timer(100).pipe(
              mergeMapTo(searchOrEmpty(queryStr)),
              map((results: ResultItem[]) => ({results, isLoading: false}))
            )
          )
        ),
        // catch any error
        catchError((error: Error, caught$) => concat(of({error}), caught$)),
        tap((nextState) => this.setState(nextState as State)),
        takeUntil(this.componentWillUnmount$.asObservable())
      )
      .subscribe()

    // trigger initial resize
    this.handleWindowResize()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.shouldBeFocused && this.props.shouldBeFocused) {
      this.fieldRef.current.inputElement.select()
    }
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.handleWindowMouseUp)
    window.removeEventListener('keydown', this.handleWindowKeyDown)
    window.removeEventListener('resize', this.handleWindowResize)

    this.componentWillUnmount$.next()
    this.componentWillUnmount$.complete()
  }

  handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.searchTerm$.next(event.currentTarget.value)
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

  handleHitMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    this.setState({activeIndex: Number(event.currentTarget.getAttribute('data-hit-index'))})
  }

  handleHitClick = () => {
    this.handleClear()
  }

  handleClear = () => {
    this.props.onClose()
    this.searchTerm$.next('')
    this.setState({isFocused: false})
  }

  handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const {results, activeIndex} = this.state
    const isArrowKey = ['ArrowUp', 'ArrowDown'].includes(event.key)
    const lastIndex = results.length - 1

    if (event.key === 'Enter') {
      const resultsEl = this.resultsRef.current.element
      const hitEl: HTMLButtonElement | null =
        resultsEl && resultsEl.querySelector(`[data-hit-index="${activeIndex}"]`)
      if (hitEl) hitEl.click()
    }

    if (event.key === 'Escape') {
      this.fieldRef.current.inputElement.blur()
    }

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

  handleWindowKeyDown = (event) => {
    if (hotKeys.debugSearch(event)) {
      this.setState((prevState) => ({isDebug: !prevState.isDebug}))
    }
  }

  handleWindowResize = () => {
    const isBleeding = !window.matchMedia('all and (min-width: 32em)').matches

    this.setState({isBleeding})
  }

  handleWindowMouseUp = () => {
    this.setState({isPressing: false})
  }

  wrapWithDebug = (item: ResultItem, children: React.ReactNode) => {
    const {isDebug} = this.state
    if (!isDebug) {
      return children
    }
    const {stories, score} = item
    return (
      <div style={{border: '1px solid #aaa'}}>
        <div style={{padding: 4, fontSize: '90%', backgroundColor: '#f0f0f0'}}>
          <strong>Total score: {Math.round(score * 100) / 100}</strong>
          <ul>
            {stories
              .filter((story) => story.score > 0)
              .map((story, i) => (
                <li key={String(i)}>
                  {story.path}: {story.score} ({story.why})
                </li>
              ))}
          </ul>
        </div>
        {children}
      </div>
    )
  }

  renderItem = (item: ResultItem, index: number, className: string): React.ReactNode => {
    const {hit} = item
    const type = schema.get(hit._type)

    return (
      <IntentLink
        className={className}
        intent="edit"
        params={{id: getPublishedId(hit._id), type: type.name}}
        data-hit-index={index}
        onMouseDown={this.handleHitMouseDown}
        onClick={this.handleHitClick}
        tabIndex={-1}
      >
        {this.wrapWithDebug(
          item,
          <Preview
            value={hit}
            layout="default"
            type={type}
            status={<div className={resultsStyles.itemType}>{type.title}</div>}
          />
        )}
      </IntentLink>
    )
  }

  renderResults(): React.ReactNode {
    const {activeIndex, error, isBleeding, isLoading, results, value} = this.state
    return (
      <SearchResults
        activeIndex={activeIndex}
        error={error}
        isBleeding={isBleeding}
        isLoading={isLoading}
        items={results}
        query={value}
        renderItem={this.renderItem}
        ref={this.resultsRef}
      />
    )
  }

  render() {
    const {isBleeding, isFocused, value} = this.state
    const isOpen = isFocused && value.length > 0
    return (
      <SearchField
        isBleeding={isBleeding}
        isFocused={isFocused}
        isOpen={isOpen}
        onBlur={this.handleBlur}
        onChange={this.handleInputChange}
        onClear={this.handleClear}
        onFocus={this.handleFocus}
        onKeyDown={this.handleKeyDown}
        onMouseDown={this.handleMouseDown}
        ref={this.fieldRef}
        results={this.renderResults()}
        value={value}
      />
    )
  }
}

export default SearchContainer
