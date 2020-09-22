import React from 'react'

type ScrollEventHandler = (event: Event) => void
interface ScrollContextValue {
  onScroll?: ScrollEventHandler
}

export const Context = React.createContext<ScrollContextValue>({})

export function ScrollMonitor({
  onScroll,
  children
}: {
  onScroll: ScrollEventHandler
  children?: React.ReactNode
}) {
  const parentContext = React.useContext(Context)
  const handleScroll = React.useCallback(
    (event: Event) => {
      onScroll(event)
      if (parentContext.onScroll) {
        parentContext.onScroll(event)
      }
    },
    [parentContext, onScroll]
  )

  return <Context.Provider value={{onScroll: handleScroll}}>{children}</Context.Provider>
}

/**
 * This provides a utility function for use within Sanity Studios to create scrollable containers
 * Note: this is used by different studio utilities to track positions of elements on screen
 * Note: It will call any given `onScroll` callback with a Native DOM Event, and not a React Synthetic event
 * Note: It will not make sure the element is actually scrollable, this still needs to be done with css as usual
 */
export function ScrollContainer<T extends React.ElementType = 'div'>({
  onScroll,
  as = 'div',
  ...props
}: React.ComponentProps<T> & {
  onScroll?: ScrollEventHandler
  as?: T
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const parentContext = React.useContext(Context)

  const handleScroll = React.useCallback(
    (event: Event) => {
      if (onScroll) {
        onScroll(event)
      }
      if (parentContext.onScroll) {
        parentContext.onScroll(event)
      }
    },
    [onScroll]
  )

  React.useEffect(() => {
    containerRef.current!.addEventListener('scroll', handleScroll, {
      passive: true
    })
    return () => {
      containerRef.current!.removeEventListener('scroll', handleScroll)
    }
  }, [onScroll])

  return React.createElement(as, {ref: containerRef, ...props})
}
