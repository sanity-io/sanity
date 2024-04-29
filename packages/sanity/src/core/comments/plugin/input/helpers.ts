import {useCallback, useEffect, useMemo, useState} from 'react'

/**
 * A function that creates a DOMRect from an array of elements.
 */
export function createDomRectFromElements(elements: Element[]): DOMRect | null {
  if (!elements || !elements.length) return null

  const rects = elements.map((el) => el.getBoundingClientRect())

  const minX = Math.min(...rects.map((r) => r.x)) || 0
  const minY = Math.min(...rects.map((r) => r.y)) || 0
  const maxRight = Math.max(...rects.map((r) => r.right)) || 0
  const maxBottom = Math.max(...rects.map((r) => r.bottom)) || 0

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

interface RectFromElementsHookOptions {
  scrollElement: HTMLElement | null
  disabled: boolean
  selector: string
}

/**
 * A hook that returns a DOMRect from an array of elements.
 * This is needed because the Range Decoration API might render se
 */
function useRectFromElements(props: RectFromElementsHookOptions): DOMRect | null {
  const {scrollElement, disabled, selector} = props
  const [rect, setRect] = useState<DOMRect | null>(null)

  const handleSetRect = useCallback(() => {
    if (disabled) return
    const elements = document?.querySelectorAll(selector)
    if (!elements) return

    const nextRect = createDomRectFromElements(Array.from(elements))

    setRect(nextRect)
  }, [disabled, selector])

  useEffect(handleSetRect, [handleSetRect])

  useEffect(() => {
    if (disabled || !scrollElement) return undefined

    scrollElement.addEventListener('wheel', handleSetRect)

    return () => {
      scrollElement.removeEventListener('wheel', handleSetRect)
    }
  }, [handleSetRect, disabled, scrollElement])

  return rect
}

export interface ReferenceElementHookOptions {
  scrollElement: HTMLElement | null
  disabled: boolean
  selector: string
}

/**
 * A hook that returns a reference element that can be used to position a popover.
 */
export function useAuthoringReferenceElement(
  props: ReferenceElementHookOptions,
): HTMLElement | null {
  const {scrollElement, disabled, selector} = props

  const rect = useRectFromElements({
    scrollElement,
    disabled,
    selector,
  })

  const element = useMemo((): HTMLElement | null => {
    if (!rect) return null

    return {
      getBoundingClientRect: () => rect,
    } as HTMLElement
  }, [rect])

  return element
}

export function getSelectionBoundingRect(): DOMRect | null {
  const selection = window.getSelection()
  let range = null

  if (selection && selection.rangeCount > 0) {
    range = selection.getRangeAt(0)
  }
  const rect = range?.getBoundingClientRect()

  return rect || null
}

export function isRangeInvalid(): boolean {
  return false
}
