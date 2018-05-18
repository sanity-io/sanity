import PropTypes from 'prop-types'
import React from 'react'
import {Observable, of as observableOf} from 'rxjs'
import {
  map,
  filter,
  switchMap,
  distinctUntilChanged,
  refCount,
  publishReplay,
  concat,
  debounceTime,
  mapTo
} from 'rxjs/operators'
import observeForPreview from '../observeForPreview'
import shallowEquals from 'shallow-equals'
import intersectionObservableFor from '../streams/intersectionObservableFor'
import visibilityChange$ from '../streams/visibilityChange'
import {INVALID_PREVIEW_CONFIG} from '../constants'
import WarningIcon from 'part:@sanity/base/warning-icon'

const INVALID_PREVIEW_FALLBACK = {
  title: <span style={{fontStyle: 'italic'}}>Invalid preview config</span>,
  subtitle: <span style={{fontStyle: 'italic'}}>Check the error log in the console</span>,
  media: WarningIcon
}

// How long to wait before signalling tear down of subscriptions
const DELAY_MS = 20 * 1000

const isVisible$ = visibilityChange$.pipe(map(event => !event.target.hidden))
const visibilityOn$ = isVisible$.pipe(filter(Boolean))
const visibilityOff$ = isVisible$.pipe(filter(isVisible => !isVisible))

// A stream of booleans to signal whether preview component should keep
// subscriptions active or not
const keepActive$ = new Observable(observer => {
  observer.next(!document.hidden)
  observer.complete()
}).pipe(
  concat(
    visibilityOn$
      .pipe(
        switchMap(on =>
          observableOf(on).pipe(concat(visibilityOff$.pipe(debounceTime(DELAY_MS), mapTo(false))))
        )
      )
      .pipe(distinctUntilChanged(), publishReplay(1), refCount())
  )
)

export default class PreviewSubscriber extends React.PureComponent {
  static propTypes = {
    type: PropTypes.object.isRequired,
    fields: PropTypes.arrayOf(PropTypes.oneOf(['title', 'description', 'imageUrl'])),
    value: PropTypes.any.isRequired,
    ordering: PropTypes.object,
    children: PropTypes.func
  }

  state = {
    error: null,
    result: {snapshot: null, type: null},
    isLive: false
  }

  componentDidMount() {
    this.subscribe(this.props.value, this.props.type, this.props.fields)
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
  }

  componentWillUpdate(nextProps) {
    if (!shallowEquals(nextProps.value, this.props.value)) {
      this.subscribe(nextProps.value, nextProps.type)
    }
  }

  subscribe(value, type, fields) {
    this.unsubscribe()

    const viewOptions = this.props.ordering ? {ordering: this.props.ordering} : {}

    const inViewport$ = intersectionObservableFor(this._element).pipe(
      map(event => event.isIntersecting)
    )

    this.subscription = keepActive$
      .pipe(
        switchMap(isVisible => (isVisible ? inViewport$ : observableOf(false))),
        distinctUntilChanged(),
        switchMap(isInViewport => {
          return isInViewport
            ? observeForPreview(value, type, fields, viewOptions)
            : observableOf(null)
        })
      )
      .subscribe(result => {
        if (result) {
          this.setState({result, isLive: true})
        } else {
          this.setState({isLive: false})
        }
      })
  }

  setElement = element => {
    this._element = element
  }

  render() {
    const {result, isLive, error} = this.state
    const {children: Child, ...props} = this.props
    const snapshot =
      result.snapshot === INVALID_PREVIEW_CONFIG ? INVALID_PREVIEW_FALLBACK : result.snapshot

    return (
      // note: the root element here should be a span since this component may be used to display inline previews
      <span ref={this.setElement}>
        <Child snapshot={snapshot} type={result.type} isLive={isLive} error={error} {...props} />
      </span>
    )
  }
}
