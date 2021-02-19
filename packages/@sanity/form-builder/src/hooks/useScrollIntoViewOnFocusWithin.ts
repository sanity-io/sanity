import {useCallback} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {useDidUpdate} from './useDidUpdate'

const SCROLL_OPTIONS = {scrollMode: 'if-needed'} as const

export function useScrollIntoViewOnFocusWithin(
  elementRef: {current?: HTMLElement},
  hasFocusWithin: boolean
): void {
  return useDidUpdate(
    hasFocusWithin,
    useCallback(
      (hasFocus, hadFocus) => {
        if (hasFocus && !hadFocus) {
          scrollIntoView(elementRef.current, SCROLL_OPTIONS)
        }
      },
      [elementRef]
    )
  )
}
