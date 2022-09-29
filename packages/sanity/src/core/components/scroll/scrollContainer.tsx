import {useForwardedRef} from '@sanity/ui'
import createPubSub from 'nano-pubsub'
import React, {useContext, useEffect, useMemo} from 'react'
import {ScrollContext} from './scrollContext'

/** @internal */
export interface ScrollContainerProps<T extends React.ElementType>
  extends Omit<React.HTMLProps<T>, 'as' | 'onScroll'> {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  onScroll?: (event: Event) => () => void
}

const noop = () => undefined

/**
 * This provides a utility function for use within Sanity Studios to create scrollable containers
 * It also provides a way for components inside a scrollable container to track onScroll on their first parent scroll container
 * NOTE: this is used by different studio utilities to track positions of elements on screen
 * NOTE: It will call any given `onScroll` callback with a Native DOM Event, and not a React Synthetic event
 * NOTE: It will not make sure the element is actually scrollable, this still needs to be done with css as usual
 *
 * @internal
 */
export const ScrollContainer = React.forwardRef(function ScrollContainer<
  T extends React.ElementType = 'div'
>(props: ScrollContainerProps<T>, ref: React.ForwardedRef<HTMLDivElement>) {
  const {as = 'div', onScroll, ...rest} = props
  const forwardedRef = useForwardedRef(ref)

  // const selfRef = useRef<HTMLElement | null>(null)
  const parentContext = useContext(ScrollContext)
  const childContext = useMemo(() => createPubSub<Event>(), [])

  useEffect(() => {
    if (onScroll) {
      // emit scroll events from children
      return childContext.subscribe(onScroll)
    }
    return noop
  }, [childContext, onScroll])

  useEffect(() => {
    // let events bubble up
    if (parentContext) {
      return childContext.subscribe(parentContext.publish)
    }
    return noop
  }, [parentContext, childContext])

  useEffect(() => {
    const handleScroll = (event: Event) => {
      childContext.publish(event)
    }

    const el = forwardedRef.current

    if (!el) {
      return undefined
    }

    el.addEventListener('scroll', handleScroll, {
      passive: true,
      capture: true,
    })

    return () => {
      el.removeEventListener('scroll', handleScroll)
    }
  }, [childContext, forwardedRef])

  return (
    <ScrollContext.Provider value={childContext}>
      {React.createElement(as, {ref: forwardedRef, 'data-testid': 'scroll-container', ...rest})}
    </ScrollContext.Provider>
  )
})
