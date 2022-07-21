import {useGlobalKeyDown, useLayer} from '@sanity/ui'
import isHotkey from 'is-hotkey'
import {useCallback, useEffect, useRef} from 'react'
import {GLOBAL_SEARCH_KEY} from '../constants'

const isSearchHotKey = isHotkey(`mod+${GLOBAL_SEARCH_KEY}`)
const isEscape = isHotkey('escape')

/**
 * - This hook binds a global shortcut combination, as well as the ESC key, to open / close callbacks.
 * - It listens to all document `focusin` events and will re-focus the last focused element prior to opening search.
 * - It will only update the last focused element whilst search is closed.
 * - It will prevent the ESC key from firing `onClose` callbacks if it's not the top most layer (i.e. if a nested dialog is mounted)
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
  const lastFocusedEl = useRef<HTMLElement>(null)

  const {isTopLayer} = useLayer()

  const focusLastElement = useCallback(() => {
    if (lastFocusedEl.current) {
      lastFocusedEl.current?.focus()
    }
  }, [lastFocusedEl])

  const handleFocusIn = useCallback(
    (event: FocusEvent) => {
      if (!open) {
        lastFocusedEl.current = event.target as HTMLElement
      }
    },
    [open]
  )

  useEffect(() => {
    document.addEventListener('focusin', handleFocusIn)
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [handleFocusIn])

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isSearchHotKey(event)) {
        event.preventDefault()
        if (open) {
          onClose()
          focusLastElement()
        } else {
          onOpen()
        }
      }
      if (isEscape(event) && open && isTopLayer) {
        onClose()
        focusLastElement()
      }
    },
    [focusLastElement, isTopLayer, open, onClose, onOpen]
  )

  useGlobalKeyDown(handleGlobalKeyDown)
}
