import React, {createElement, createRef} from 'react'
import {defer, concat, of as observableOf, Subscription} from 'rxjs'
import {
  map,
  tap,
  switchMap,
  distinctUntilChanged,
  refCount,
  publishReplay,
  delay,
} from 'rxjs/operators'
import {intersectionObservableFor} from '../streams/intersectionObservableFor'
import {visibilityChange$} from '../streams/visibilityChange'

const STYLE = {
  minHeight: 1,
  minWidth: 1,
}

const isVisible$ = visibilityChange$.pipe(map((event: Event) => !(event.target as any).hidden))

// A stream of booleans to signal whether preview component should keep
// subscriptions active or not
const documentVisibility$ = concat(
  defer(() => observableOf(!document.hidden)),
  isVisible$
).pipe(distinctUntilChanged(), publishReplay(1), refCount())

export interface WithVisibilityProps {
  // How long to wait before signalling hide
  hideDelay: number
  element?: string
  style?: React.CSSProperties
  children: (isVisible: boolean) => React.ReactNode
}

export interface WithVisibilityState {
  isVisible: boolean
}

export class WithVisibility extends React.Component<WithVisibilityProps, WithVisibilityState> {
  element: React.RefObject<HTMLElement> = createRef()
  subscription: Subscription | null = null
  state: WithVisibilityState = {isVisible: false}

  componentDidMount() {
    const {hideDelay = 0} = this.props

    if (!this.element.current) {
      return
    }

    const inViewport$ = intersectionObservableFor(this.element.current).pipe(
      map((event) => event.isIntersecting)
    )

    this.subscription = documentVisibility$
      .pipe(
        switchMap((isVisible) => (isVisible ? inViewport$ : observableOf(false))),
        switchMap((isVisible) =>
          isVisible ? observableOf(true) : observableOf(false).pipe(delay(hideDelay))
        ),
        distinctUntilChanged(),
        tap((isVisible) => {
          this.setState({isVisible})
        })
      )
      .subscribe()
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
  }

  render() {
    const {isVisible} = this.state
    const {
      children,
      style = {},
      element = 'span',
      hideDelay, // omit
      ...rest
    } = this.props

    return createElement(
      element,
      {
        ref: this.element,
        style: {...STYLE, ...style},
        ...rest,
      }, // Render a nonbreaking space here because of https://bugs.chromium.org/p/chromium/issues/detail?id=972196
      isVisible ? children(isVisible) : '\u00A0' // &nbsp
    )
  }
}
