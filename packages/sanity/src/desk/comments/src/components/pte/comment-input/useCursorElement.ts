import {useState, useMemo, useEffect, useCallback} from 'react'

const EVENT_LISTENER_OPTIONS: AddEventListenerOptions = {passive: true}

interface CursorElementHookOptions {
  disabled: boolean
  rootElement: HTMLElement | null
}

/**
 * @beta
 * @hidden
 */
export function useCursorElement(opts: CursorElementHookOptions): HTMLElement | null {
  const {disabled, rootElement} = opts
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)

  const cursorElement = useMemo(() => {
    if (!cursorRect) {
      return null
    }
    return {
      getBoundingClientRect: () => {
        return cursorRect
      },
    } as HTMLElement
  }, [cursorRect])

  const handleSelectionChange = useCallback(() => {
    if (disabled) {
      setCursorRect(null)
      return
    }

    const sel = window.getSelection()

    if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return

    const range = sel.getRangeAt(0)
    const isWithinRoot = rootElement?.contains(range.commonAncestorContainer)

    if (!isWithinRoot) {
      setCursorRect(null)
      return
    }
    const rect = range?.getBoundingClientRect()
    if (rect) {
      setCursorRect(rect)
    }
  }, [disabled, rootElement])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange, EVENT_LISTENER_OPTIONS)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleSelectionChange])

  return cursorElement
}
