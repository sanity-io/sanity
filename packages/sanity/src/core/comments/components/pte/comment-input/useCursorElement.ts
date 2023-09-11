import {useState, useMemo, useEffect, useCallback} from 'react'

const EVENT_LISTENER_OPTIONS: AddEventListenerOptions = {passive: true}

interface CursorElementHookOptions {
  disabled: boolean
  rootElement: HTMLElement | null
}

export function useCursorElement(opts: CursorElementHookOptions): HTMLElement | null {
  const {disabled, rootElement} = opts
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)
  const [selection, setSelection] = useState<{
    anchorNode: Node | null
    anchorOffset: number
    focusNode: Node | null
    focusOffset: number
  } | null>(null)

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
      setSelection(null)
      return
    }

    const sel = window.getSelection()

    if (!sel || !sel.isCollapsed) return

    const range = sel.getRangeAt(0)
    const isWithinRoot = rootElement?.contains(range.commonAncestorContainer)

    if (!isWithinRoot) return

    const {anchorNode, anchorOffset, focusNode, focusOffset} = sel
    setSelection({
      anchorNode,
      anchorOffset,
      focusNode,
      focusOffset,
    })
  }, [disabled, rootElement])

  useEffect(() => {
    if (!selection || disabled) {
      setCursorRect(null)
      return
    }

    const {anchorNode, focusNode} = selection

    if (rootElement?.contains(anchorNode) && anchorNode === focusNode) {
      try {
        const range = window.getSelection()?.getRangeAt(0)
        const rect = range?.getBoundingClientRect()

        if (rect) {
          setCursorRect(rect)
        }
      } catch (_) {
        setCursorRect(null)
      }
    }
  }, [disabled, rootElement, selection])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange, EVENT_LISTENER_OPTIONS)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleSelectionChange])

  return cursorElement
}
