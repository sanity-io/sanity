import {useCallback, useEffect, useState} from 'react'
import {RovingFocusProps} from './types'

const MUTATION_ATTRIBUTE_FILTER = ['aria-hidden', 'disabled', 'href']

const FOCUSABLE =
  'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'

function getFocusableElements(element: HTMLElement) {
  return [...(element.querySelectorAll(FOCUSABLE) as any)].filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  ) as HTMLElement[]
}

/** This hook handles focus with the keyboard arrows.
 *
 * - Roving focus definition [https://a11y-solutions.stevenwoodson.com/solutions/focus/roving-focus/]
 * - Example usage:
 * 
 * ```
  function MyComponent() {
      const [rootElement, setRootElement] = setRootElement(null)

      useRovingFocus({
        rootElement: rootElement,
      })

      return (
        <div ref={setRootElement}>
          <button>Button</button>
          <button>Button</button>
          <button>Button</button>
        </div>
      )
  }
  ```
 */
export function useRovingFocus(props: RovingFocusProps): undefined {
  const {
    direction = 'horizontal',
    initialFocus,
    loop = true,
    navigation = ['arrows'],
    pause = false,
    rootElement,
  } = props
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([])

  const focusableLen = focusableElements.length
  const lastFocusableIndex = focusableLen - 1

  /**
   * Determine what keys to listen to depending on direction
   */
  const nextKey = direction === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
  const prevKey = direction === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'

  /**
   * Set focusable elements in state
   */
  const handleSetElements = useCallback(() => {
    if (rootElement) {
      const els = getFocusableElements(rootElement)

      setFocusableElements(els)
    }
  }, [rootElement])

  /**
   * Set focused index
   */
  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index)
  }, [])

  /**
   * Handle increment/decrement of focusedIndex
   */
  const handleKeyDown = useCallback(
    (event) => {
      if (pause) {
        return
      }

      const focusPrev = () => {
        event.preventDefault()
        setFocusedIndex((prevIndex) => {
          const next = (prevIndex + lastFocusableIndex) % focusableLen

          if (!loop && next === lastFocusableIndex) {
            return prevIndex
          }

          return next
        })
      }

      const focusNext = () => {
        event.preventDefault()
        setFocusedIndex((prevIndex) => {
          const next = (prevIndex + 1) % focusableLen

          if (!loop && next === 0) {
            return prevIndex
          }

          return next
        })
      }

      if (event.key === 'Tab' && navigation.includes('tab')) {
        if (event.shiftKey) {
          focusPrev()
        } else {
          focusNext()
        }
      }

      if (navigation.includes('arrows')) {
        if (event.key === prevKey) {
          focusPrev()
        }

        if (event.key === nextKey) {
          focusNext()
        }
      }
    },
    [pause, prevKey, navigation, nextKey, lastFocusableIndex, focusableLen, loop]
  )

  /**
   * Set focusable elements on mount
   */
  useEffect(() => {
    handleSetElements()
  }, [handleSetElements, initialFocus, direction])

  /**
   * Listen to DOM mutations to update focusableElements with latest state
   */
  useEffect(() => {
    const mo = new MutationObserver(handleSetElements)

    if (rootElement) {
      mo.observe(rootElement, {
        childList: true,
        subtree: true,
        attributeFilter: MUTATION_ATTRIBUTE_FILTER,
      })
    }

    return () => {
      mo.disconnect()
    }
  }, [focusableElements, handleSetElements, rootElement])

  /**
   * Set focus on elements in focusableElements depending on focusedIndex
   */
  useEffect(() => {
    focusableElements.forEach((el, index) => {
      if (index === focusedIndex) {
        el.setAttribute('tabIndex', '0')
        el.setAttribute('aria-selected', 'true')
        el.focus()
        el.onfocus = () => handleFocus(index)
        el.onblur = () => handleFocus(-1)
      } else {
        el.setAttribute('tabIndex', '-1')
        el.setAttribute('aria-selected', 'false')
        el.onfocus = () => handleFocus(index)
      }
    })

    if (focusedIndex === -1 && focusableElements) {
      const initialIndex = initialFocus === 'last' ? lastFocusableIndex : 0
      focusableElements[initialIndex]?.setAttribute('tabIndex', '0')
    }
  }, [focusableElements, focusedIndex, handleFocus, initialFocus, lastFocusableIndex])

  /**
   * Listen to key down events on rootElement
   */
  useEffect(() => {
    rootElement?.addEventListener('keydown', handleKeyDown)

    return () => {
      rootElement?.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, rootElement])

  return undefined
}
