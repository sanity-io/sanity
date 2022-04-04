import {useEffect} from 'react'
import {resizeObserver} from '../../../util'

export function useResizeObserver(
  element: HTMLDivElement,
  onResize: (event: ResizeObserverEntry) => void
): void {
  useEffect(() => resizeObserver.observe(element, onResize), [element, onResize])
}
