import PropTypes from 'prop-types'
import React from 'react'
import Observable from '@sanity/observable'
import observeForPreview from '../observeForPreview'
import shallowEquals from 'shallow-equals'
import intersectionObservableFor from '../streams/intersectionObservableFor'
import visibilityChange$ from '../streams/visibilityChange'

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

    const viewOptions = this.props.ordering
      ? {ordering: this.props.ordering}
      : {}

    const visibilityOn$ = Observable.of(!document.hidden)
      .merge(visibilityChange$.map(event => !event.target.hidden))

    const inViewport$ = intersectionObservableFor(this._element)
      .map(event => event.isIntersecting)

    this.subscription = visibilityOn$
      .distinctUntilChanged()
      .switchMap(isVisible => (isVisible ? inViewport$ : Observable.of(false)))
      .distinctUntilChanged()
      .switchMap(isInViewport => {
        return isInViewport
          ? observeForPreview(value, type, fields, viewOptions)
          : Observable.of(null)
      })
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
    return (
      // note: the root element here should be a span since this component may be used to display inline previews
      <span ref={this.setElement}>
        <Child snapshot={result.snapshot} type={result.type} isLive={isLive} error={error} {...props} />
      </span>
    )
  }
}
