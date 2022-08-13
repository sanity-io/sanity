import {useGlobalKeyDown, useLayer} from '@sanity/ui'
import isHotkey from 'is-hotkey'
import {useCallback, useEffect, useRef} from 'react'
import {GLOBAL_SEARCH_KEY} from '../constants'

const isSearchHotKey = isHotkey(`mod+${GLOBAL_SEARCH_KEY}`)
const isEscape = isHotkey('escape')

/**
 * This hook binds a global shortcut combination, as well as the ESC key, to open / close callbacks.
 *
 * It listens to all document `focusout` events and will re-focus the last element that lost focus prior
 * to opening search, but only whilst search is closed.
 *
 * It will prevent the ESC key from firing `onClose` callbacks if it's not the top most layer
 * (i.e. if a nested dialog is mounted).
 */
export function useSearchHotkeys({
  open,
  onClose,
  onOpen,
}: {
  open: boolean
  onClose: () => void
  onOpen: () => void
}): void {
  const lastFocusedRef = useRef<HTMLElement>(null)

  const {isTopLayer} = useLayer()

  const handleClose = useCallback(() => {
    onClose()

    if (lastFocusedRef.current) {
      setTimeout(() => lastFocusedRef.current?.focus(), 0)
    }
  }, [onClose])

  /**
   * Capture the last focused element (if search is closed)
   */
  const handleFocusOut = useCallback(
    (event: FocusEvent) => {
      if (!open) {
        lastFocusedRef.current = event.target as HTMLElement
      }
    },
    [open]
  )

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isSearchHotKey(event)) {
        event.preventDefault()
        if (open) {
          handleClose()
        } else {
          // Immediately store current active element, as opening search via this keyboard shortcut
          // won't trigger a qualifying `focusout` event.
          lastFocusedRef.current = document.activeElement as HTMLElement
          onOpen()
        }
      }
      if (isEscape(event) && open && isTopLayer) {
        handleClose()
      }
    },
    [handleClose, isTopLayer, open, onOpen]
  )

  useGlobalKeyDown(handleGlobalKeyDown)

  useEffect(() => {
    document.addEventListener('focusout', handleFocusOut)
    return () => {
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [handleFocusOut])
}
