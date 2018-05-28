import React from 'react'
import {defer, concat, of as observableOf} from 'rxjs'

import intersectionObservableFor from '../streams/intersectionObservableFor'
import visibilityChange$ from '../streams/visibilityChange'
import {
  map,
  tap,
  switchMap,
  distinctUntilChanged,
  refCount,
  publishReplay,
  delay
} from 'rxjs/operators'

const isVisible$ = visibilityChange$.pipe(map(event => !event.target.hidden))

// note: the root element here should be  since this component may be used to display inline elements
const STYLE = {display: 'inline-block', minHeight: '1px', minWidth: '1px'}

// A stream of booleans to signal whether preview component should keep
// subscriptions active or not
const documentVisibility$ = concat(defer(() => observableOf(!document.hidden)), isVisible$).pipe(
  distinctUntilChanged(),
  publishReplay(1),
  refCount()
)

type Props = {
  // How long to wait before signalling hide
  hideDelay: Number,
  children: (isVisible: boolean) => React.Element<*>
}

type State = {
  isVisible: boolean
}

export default class WithVisibility extends React.Component<Props, State> {
  element = React.createRef()

  state = {isVisible: null}

  componentDidMount() {
    const {hideDelay = 0} = this.props
    const inViewport$ = intersectionObservableFor(this.element.current).pipe(
      map(event => event.isIntersecting)
    )

    this.subscription = documentVisibility$
      .pipe(
        switchMap(isVisible => (isVisible ? inViewport$ : observableOf(false))),
        switchMap(
          isVisible => (isVisible ? observableOf(true) : observableOf(false).pipe(delay(hideDelay)))
        ),
        distinctUntilChanged(),
        tap(isVisible => {
          this.setState({isVisible})
        })
      )
      .subscribe()
  }

  componentWillUnmount() {
    this.subscription.unsubscribe()
    this.subscription = null
  }

  render() {
    const {isVisible} = this.state
    const {children} = this.props
    return (
      <div style={STYLE} ref={this.element}>
        {children(isVisible)}
      </div>
    )
  }
}
