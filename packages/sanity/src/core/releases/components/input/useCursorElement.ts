import {useCallback, useEffect, useState} from 'react'

const EVENT_LISTENER_OPTIONS: AddEventListenerOptions = {passive: true}

interface CursorElementHookOptions {
  disabled: boolean
  rootElement: HTMLElement | null
}

export function useCursorElement(opts: CursorElementHookOptions): HTMLElement | null {
  const {disabled, rootElement} = opts
  const [cursorElement, setCursorElement] = useState<HTMLElement | null>(null)

  const handleSelectionChange = useCallback(() => {
    if (disabled) {
      setCursorElement(null)
      return
    }

    const sel = window.getSelection()

    if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return

    const range = sel.getRangeAt(0)

    if (!rootElement?.contains(range.commonAncestorContainer)) {
      setCursorElement(null)
      return
    }

    const rect = range.getBoundingClientRect()
    setCursorElement({getBoundingClientRect: () => rect} as HTMLElement)
  }, [disabled, rootElement])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange, EVENT_LISTENER_OPTIONS)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleSelectionChange])

  return cursorElement
}
