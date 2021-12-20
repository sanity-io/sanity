import {useEffect} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'

// Special case to scroll annotated text into view inside the editor when they display their editing interface.
// Special, because the focusPath is not on the editable item (the annotated text) at that time - unlike block and inline objects.
export function useScrollToAnnotation(
  elementRef: React.MutableRefObject<HTMLSpanElement>,
  scrollElement: HTMLElement,
  isAnnotation: boolean
): void {
  useEffect(() => {
    if (isAnnotation && elementRef.current) {
      scrollIntoView(elementRef.current, {
        boundary: scrollElement,
        scrollMode: 'if-needed',
      })
    }
  }, [elementRef, isAnnotation, scrollElement])
}
