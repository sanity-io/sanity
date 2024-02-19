import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

const EVENT_LISTENER_OPTIONS: AddEventListenerOptions = {passive: true}

interface CursorElementHookOptions {
  disabled:
    | boolean
    | 'collapsed'
    | 'expanded'
    | (({selectionType}: {selectionType: 'collapsed' | 'expanded'}) => boolean)
  rootElement: HTMLElement | null
}
/**
 * Returns a HTML Element that represents the current text cursor position in the document.
 * @internal
 */
export function useCursorElement(opts: CursorElementHookOptions): HTMLElement | null {
  const {disabled, rootElement} = opts
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)
  const rangeRef = useRef<Range | null>(null)

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
    if (typeof disabled === 'boolean' && disabled) {
      setCursorRect(null)
      return
    }

    const sel = window.getSelection()

    if (!sel || sel.rangeCount === 0) {
      setCursorRect(null)
      return
    }

    if (
      typeof disabled === 'function' &&
      disabled({selectionType: sel.isCollapsed ? 'collapsed' : 'expanded'})
    ) {
      setCursorRect(null)
      return
    }

    const range = sel.getRangeAt(0)
    rangeRef.current = range
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

  const handleScroll = useCallback(() => {
    if (rangeRef.current) {
      setCursorRect(rangeRef.current.getBoundingClientRect())
    }
  }, [])

  useEffect(() => {
    if (typeof disabled === 'boolean' && disabled) {
      return undefined
    }

    rootElement?.addEventListener('scroll', handleScroll, EVENT_LISTENER_OPTIONS)

    return () => {
      rootElement?.removeEventListener('scroll', handleScroll)
    }
  }, [disabled, rootElement, handleScroll])

  return cursorElement
}
