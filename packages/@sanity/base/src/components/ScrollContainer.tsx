import React, {createElement, forwardRef, useCallback, useEffect, useContext, useRef} from 'react'

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

interface ScrollContainerProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  onScroll?: ScrollEventHandler
}

/**
 * This provides a utility function for use within Sanity Studios to create scrollable containers
 * Note: this is used by different studio utilities to track positions of elements on screen
 * Note: It will call any given `onScroll` callback with a Native DOM Event, and not a React Synthetic event
 * Note: It will not make sure the element is actually scrollable, this still needs to be done with css as usual
 */
export const ScrollContainer = forwardRef(
  (props: ScrollContainerProps & Omit<React.HTMLProps<HTMLElement>, 'onScroll'>, ref) => {
    const {as = 'div', onScroll, ...restProps} = props
    const rootRef = useRef<HTMLElement | null>(null)
    const parentContext = useContext(Context)

    const handleScroll = useCallback(
      (event: Event) => {
        if (onScroll) {
          onScroll(event)
        }
        if (parentContext.onScroll) {
          parentContext.onScroll(event)
        }
      },
      [onScroll, parentContext]
    )

    useEffect(() => {
      const rootElement = rootRef.current

      if (rootElement) {
        rootElement.addEventListener('scroll', handleScroll, {
          passive: true
        })
      }

      return () => {
        if (rootElement) {
          rootElement.removeEventListener('scroll', handleScroll)
        }
      }
    }, [handleScroll])

    const setRef = (el: HTMLElement | null) => {
      console.log('setRef', el)
      rootRef.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref && typeof ref === 'object') ref.current = el
    }

    return createElement(as, {...restProps, ref: setRef})
  }
)

ScrollContainer.displayName = 'ScrollContainer'
