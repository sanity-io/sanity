import {useState, useEffect, useMemo} from 'react'

/**
 * A function that creates a DOMRect from an array of elements.
 */
export function createDomRectFromElements(elements: Element[]): DOMRect | null {
  if (!elements || !elements.length) return null

  const rects = elements.map((el) => el.getBoundingClientRect())

  const minX = Math.min(...rects.map((r) => r.x))
  const minY = Math.min(...rects.map((r) => r.y))
  const maxRight = Math.max(...rects.map((r) => r.right))
  const maxBottom = Math.max(...rects.map((r) => r.bottom))

  return {
    x: minX,
    y: minY,
    width: maxRight - minX,
    height: maxBottom - minY,
    top: minY,
    right: maxRight,
    bottom: maxBottom,
    left: minX,
  } as DOMRect
}

interface UseRectFromElementsOptions {
  selector: string
  dependency: any
}

/**
 * A hook that returns a DOMRect from an array of elements.
 */
function useRectFromElements(props: UseRectFromElementsOptions): DOMRect | null {
  const {selector, dependency} = props
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!dependency) return undefined
    const elements = document?.querySelectorAll(selector)
    if (!elements) return undefined

    const nextRect = createDomRectFromElements(Array.from(elements))

    const raf = requestAnimationFrame(() => {
      setRect(nextRect)
    })

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [dependency, selector])

  return rect
}

interface UseReferenceElementRectOptions {
  selector: string
  dependency: any
}

/**
 * A hook that returns a reference element that can be used to position a popover.
 */
export function useReferenceElement(props: UseReferenceElementRectOptions): HTMLElement | null {
  const {selector, dependency} = props

  const rect = useRectFromElements({
    selector,
    dependency,
  })

  return useMemo(() => {
    if (!rect) return null

    return {
      getBoundingClientRect: () => rect,
    } as HTMLElement
  }, [rect])
}
