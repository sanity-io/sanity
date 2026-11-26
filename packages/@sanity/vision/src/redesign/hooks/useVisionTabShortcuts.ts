import {useEffect, useEffectEvent} from 'react'

import {matchVisionTabShortcut, type VisionTabShortcutId} from '../util/shortcuts'

interface VisionTabShortcutsOptions {
  /** Events outside this element (other studio UI, dialogs) are ignored */
  rootElement: HTMLElement | null
  /** Receives the shortcut and its key event, whose target is the element that has focus */
  onShortcut: (shortcut: VisionTabShortcutId, event: KeyboardEvent) => void
}

/**
 * The shortcuts that open, close and switch tabs, listening on the document so they work wherever
 * the focus is inside the tool
 */
export function useVisionTabShortcuts({rootElement, onShortcut}: VisionTabShortcutsOptions): void {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!rootElement || !(event.target instanceof Node) || !rootElement.contains(event.target)) {
      return
    }
    const shortcut = matchVisionTabShortcut(event)
    if (!shortcut) return
    event.preventDefault()
    event.stopPropagation()
    onShortcut(shortcut, event)
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handleKeyDown(event)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])
}
