import createPubSub from 'nano-pubsub'
import {
  type ElementType,
  type ForwardedRef,
  forwardRef,
  type HTMLProps,
  memo,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {ScrollContext} from 'sanity/_singletons'

/** @internal */
export interface ScrollContainerProps<T extends ElementType>
  extends Omit<HTMLProps<T>, 'as' | 'onScroll'> {
  as?: ElementType | keyof React.JSX.IntrinsicElements
  onScroll?: (event: Event) => () => void
}

const ScrollContainerComponent = forwardRef(function ScrollContainerComponent<
  T extends ElementType = 'div',
>(props: ScrollContainerProps<T>, forwardedRef: ForwardedRef<HTMLDivElement>) {
  const {as: As = 'div', onScroll, ...rest} = props
  const ref = useRef<HTMLDivElement | null>(null)

  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(forwardedRef, () => ref.current)

  const parentContext = useContext(ScrollContext)
  const [childContext] = useState(() => createPubSub<Event>())

  useEffect(() => {
    if (!onScroll) return undefined
    // emit scroll events from children
    return childContext.subscribe(onScroll)
  }, [childContext, onScroll])

  useEffect(() => {
    if (!parentContext) return undefined
    // let events bubble up
    return childContext.subscribe(parentContext.publish)
  }, [parentContext, childContext])

  useEffect(() => {
    const handleScroll = (event: Event) => {
      childContext.publish(event)
    }

    const el = ref.current

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
  }, [childContext, ref])

  return (
    <ScrollContext.Provider value={childContext}>
      <As data-testid="scroll-container" {...rest} ref={ref} />
    </ScrollContext.Provider>
  )
})

/**
 * This provides a utility function for use within Sanity Studios to create scrollable containers
 * It also provides a way for components inside a scrollable container to track onScroll on their first parent scroll container
 * NOTE: this is used by different studio utilities to track positions of elements on screen
 * NOTE: It will call any given `onScroll` callback with a Native DOM Event, and not a React Synthetic event
 * NOTE: It will not make sure the element is actually scrollable, this still needs to be done with css as usual
 *
 * @internal
 */
export const ScrollContainer = memo(ScrollContainerComponent)
ScrollContainer.displayName = 'Memo(Forwardref(ScrollContainer))'
