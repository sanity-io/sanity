import {useCallback} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {useDidUpdate} from './useDidUpdate'

const SCROLL_OPTIONS = {scrollMode: 'if-needed'} as const

/**
 * A hook to help make sure the parent element of a value edited in a dialog (or "out of band") stays
 visible in the background
 * @param elementRef The element to scroll into view when the proivided focusWithin changes from true to false
 * @param hasFocusWithin A boolean indicating whether we have has focus within the currently edited value
 */
export function useScrollIntoViewOnFocusWithin(
  elementRef: {current: HTMLElement | null},
  hasFocusWithin: boolean
): void {
  return useDidUpdate(
    hasFocusWithin,
    useCallback(
      (hadFocus, hasFocus) => {
        if (elementRef.current && !hadFocus && hasFocus) {
          scrollIntoView(elementRef.current, SCROLL_OPTIONS)
        }
      },
      [elementRef]
    )
  )
}
