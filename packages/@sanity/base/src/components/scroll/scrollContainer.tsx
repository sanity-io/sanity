import React from 'react'
import createPubSub from 'nano-pubsub'
import {ScrollContext} from './scrollContext'

export interface ScrollContainerProps<T extends React.ElementType>
  extends Omit<React.HTMLProps<T>, 'as' | 'onScroll'> {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  onScroll?: (event: Event) => () => void
}

const noop = () => undefined

/**
 * This provides a utility function for use within Sanity Studios to create scrollable containers
 * It also provides a way for components inside a scrollable container to track onScroll on their first parent scroll container
 * Note: this is used by different studio utilities to track positions of elements on screen
 * Note: It will call any given `onScroll` callback with a Native DOM Event, and not a React Synthetic event
 * Note: It will not make sure the element is actually scrollable, this still needs to be done with css as usual
 */
export const ScrollContainer = React.forwardRef(function ScrollContainer<
  T extends React.ElementType = 'div'
>(props: ScrollContainerProps<T>, forwardedRef) {
  const {as = 'div', onScroll, ...rest} = props

  const selfRef = React.useRef<HTMLElement | null>(null)
  const parentContext = React.useContext(ScrollContext)
  const childContext = React.useMemo(() => createPubSub<Event>(), [])

  React.useEffect(() => {
    if (onScroll) {
      // emit scroll events from children
      return childContext.subscribe(onScroll)
    }
    return noop
  }, [childContext, onScroll])

  React.useEffect(() => {
    // let events bubble up
    if (parentContext) {
      return childContext.subscribe(parentContext.publish)
    }
    return noop
  }, [parentContext, childContext])

  React.useEffect(() => {
    const handleScroll = (event: Event) => {
      childContext.publish(event)
    }

    if (selfRef.current) {
      selfRef.current.addEventListener('scroll', handleScroll, {
        passive: true,
        capture: true,
      })
    }

    return () => {
      if (selfRef.current) {
        selfRef.current.removeEventListener('scroll', handleScroll)
      }
    }
  }, [childContext])

  const setRef = (el: HTMLElement | null) => {
    selfRef.current = el
    if (typeof forwardedRef === 'function') forwardedRef(el)
    else if (forwardedRef && typeof forwardedRef === 'object') forwardedRef.current = el
  }

  return (
    <ScrollContext.Provider value={childContext}>
      {React.createElement(as, {ref: setRef, 'data-testid': 'scroll-container', ...rest})}
    </ScrollContext.Provider>
  )
})
