import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

const EVENT_LISTENER_OPTIONS: AddEventListenerOptions = {passive: true}
const SCROLL_LISTENER_OPTIONS: AddEventListenerOptions = {passive: true, capture: true}

function emptyRect(): DOMRect {
  return typeof DOMRect === 'undefined'
    ? ({x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0} as DOMRect)
    : new DOMRect()
}

interface CursorElementHookOptions {
  disabled: boolean
  rootElement: HTMLElement | null
}

/**
 * Virtual reference element for the mentions popover, anchored to the caret.
 *
 * The rect must stay live across scroll: the inline comment composer (and this
 * menu) are portaled, so a cached viewport rect goes stale when the document
 * pane scrolls (SAPP-4093). `contextElement` lets Floating UI's autoUpdate
 * attach to the input's overflow ancestors; capture-phase scroll covers scroll
 * containers that are not ancestors of the portal.
 */
export function useCursorElement(opts: CursorElementHookOptions): HTMLElement | null {
  const {disabled, rootElement} = opts
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)
  const rangeRef = useRef<Range | null>(null)
  const rafRef = useRef<number | null>(null)

  const syncFromSelection = useCallback(() => {
    if (disabled) {
      rangeRef.current = null
      setCursorRect(null)
      return
    }

    const sel = window.getSelection()

    if (!sel || !sel.isCollapsed || sel.rangeCount === 0) {
      return
    }

    const range = sel.getRangeAt(0)
    const isWithinRoot = rootElement?.contains(range.commonAncestorContainer)

    if (!isWithinRoot) {
      rangeRef.current = null
      setCursorRect(null)
      return
    }

    // Clone so endpoint offsets stay stable if the live selection moves elsewhere;
    // getBoundingClientRect still reflects the nodes' current viewport position.
    rangeRef.current = range.cloneRange()
    setCursorRect(range.getBoundingClientRect())
  }, [disabled, rootElement])

  const scheduleRectRefresh = useCallback(() => {
    if (disabled || !rangeRef.current) {
      return
    }
    if (rafRef.current !== null) {
      return
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const range = rangeRef.current
      if (!range) {
        return
      }
      setCursorRect(range.getBoundingClientRect())
    })
  }, [disabled])

  useEffect(() => {
    document.addEventListener('selectionchange', syncFromSelection, EVENT_LISTENER_OPTIONS)

    return () => {
      document.removeEventListener('selectionchange', syncFromSelection)
    }
  }, [syncFromSelection])

  // When the menu opens (or the editable mounts), sync once from the current caret.
  useEffect(() => {
    if (disabled) {
      rangeRef.current = null
      const clearFrame = requestAnimationFrame(() => setCursorRect(null))
      return () => cancelAnimationFrame(clearFrame)
    }

    const syncFrame = requestAnimationFrame(() => syncFromSelection())
    return () => cancelAnimationFrame(syncFrame)
  }, [disabled, rootElement, syncFromSelection])

  useEffect(() => {
    if (disabled) {
      return undefined
    }

    // Capture phase: pane scroll containers are often not ancestors of the
    // portaled mentions popover, so bubble listeners on the portal miss them.
    document.addEventListener('scroll', scheduleRectRefresh, SCROLL_LISTENER_OPTIONS)
    window.addEventListener('resize', scheduleRectRefresh, EVENT_LISTENER_OPTIONS)

    return () => {
      document.removeEventListener('scroll', scheduleRectRefresh, SCROLL_LISTENER_OPTIONS)
      window.removeEventListener('resize', scheduleRectRefresh)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [disabled, scheduleRectRefresh])

  return useMemo(() => {
    if (!cursorRect) {
      return null
    }
    return {
      contextElement: rootElement ?? undefined,
      getBoundingClientRect: () => {
        const liveRect = rangeRef.current?.getBoundingClientRect()
        return liveRect ?? cursorRect ?? emptyRect()
      },
    } as unknown as HTMLElement
  }, [cursorRect, rootElement])
}
