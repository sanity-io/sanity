import {useEffect} from 'react'
import {resizeObserver} from '../../../../core/util'

export function useResizeObserver(
  element: HTMLDivElement,
  onResize: (event: ResizeObserverEntry) => void
): void {
  useEffect(() => resizeObserver.observe(element, onResize), [element, onResize])
}
