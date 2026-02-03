import {resizeObserver} from '../../util'
import {useEffect} from 'react'

export function useResizeObserver(
  element: HTMLDivElement,
  onResize: (event: ResizeObserverEntry) => void,
): void {
  useEffect(() => resizeObserver.observe(element, onResize), [element, onResize])
}
