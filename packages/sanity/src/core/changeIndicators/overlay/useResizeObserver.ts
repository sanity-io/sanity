import {useEffect} from 'react'

import {resizeObserver} from '../../util/resizeObserver'

export function useResizeObserver(
  element: HTMLDivElement,
  onResize: (event: ResizeObserverEntry) => void,
): void {
  useEffect(() => resizeObserver.observe(element, onResize), [element, onResize])
}
