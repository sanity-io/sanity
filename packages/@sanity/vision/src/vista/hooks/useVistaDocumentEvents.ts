import {useEffect} from 'react'
import {useEffectEvent} from 'use-effect-event'

import {isVisionPasteTarget} from '../../util/isVisionPasteTarget'
import {matchVistaShortcut, type VistaShortcutId} from '../util/shortcuts'

interface VistaDocumentEventsOptions {
  /** Events outside this element (other studio UI, dialogs) are ignored */
  rootElement: HTMLElement | null
  onShortcut: (shortcut: VistaShortcutId) => void
  /**
   * Receives pasted text; returning `true` claims the paste (it is not inserted), so anything
   * that is not a query URL still pastes natively.
   */
  onPaste: (text: string) => boolean
}

/**
 * The tool-wide keyboard shortcuts and the paste-a-query-URL handler, listening on the document
 * so they work wherever the focus is inside the tool.
 */
export function useVistaDocumentEvents({
  rootElement,
  onShortcut,
  onPaste,
}: VistaDocumentEventsOptions): void {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!rootElement || !(event.target instanceof Node) || !rootElement.contains(event.target)) {
      return
    }
    const shortcut = matchVistaShortcut(event)
    if (!shortcut) return
    event.preventDefault()
    event.stopPropagation()
    onShortcut(shortcut)
  })

  const handlePaste = useEffectEvent((event: ClipboardEvent) => {
    if (!event.clipboardData || !isVisionPasteTarget(rootElement, event)) return
    if (onPaste(event.clipboardData.getData('text/plain'))) {
      event.preventDefault()
    }
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handleKeyDown(event)
    const onPasteEvent = (event: ClipboardEvent) => handlePaste(event)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('paste', onPasteEvent)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('paste', onPasteEvent)
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [])
}
