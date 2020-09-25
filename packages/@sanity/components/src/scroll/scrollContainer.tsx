import React from 'react'
import createPubSub from 'nano-pubsub'
import {ScrollContext} from './scrollContext'

interface ScrollContainerProps<T extends React.ElementType> extends Omit<React.HTMLProps<T>, 'as' | 'onScroll'> {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  onScroll?: (event: Event) => any
}

const noop = () => {}
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

  const selfRef = React.useRef<any>(null)
  const parentContext = React.useContext(ScrollContext)
  const childContext = React.useMemo(() => createPubSub<Event>(), [])

  const handleScroll = React.useCallback((event: Event) => {
    childContext.publish(event)
  }, [])

  // eslint-disable-next-line consistent-return
  React.useEffect(() => {
    if (props.onScroll) {
      // emit scroll events from children
      return childContext.subscribe(props.onScroll)
    }
    return noop
  }, [childContext, props.onScroll])

  // eslint-disable-next-line consistent-return
  React.useEffect(() => {
    // let events bubble up
    if (parentContext) {
      return childContext.subscribe(parentContext.publish)
    }
    return noop
  }, [parentContext, childContext])

  React.useEffect(() => {
    selfRef.current!.addEventListener('scroll', handleScroll, {
      passive: true
    })
    return () => {
      selfRef.current!.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const setRef = (el: HTMLElement | null) => {
    selfRef.current = el
    if (typeof forwardedRef === 'function') forwardedRef(el)
    else if (forwardedRef && typeof forwardedRef === 'object') forwardedRef.current = el
  }
  return (
    <ScrollContext.Provider value={childContext}>
      {React.createElement(as, {ref: setRef, ...rest})}
    </ScrollContext.Provider>
  )
})
