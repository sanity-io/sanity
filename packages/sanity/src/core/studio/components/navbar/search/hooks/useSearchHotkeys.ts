import {useGlobalKeyDown, useLayer} from '@sanity/ui'
import isHotkey from 'is-hotkey'
import {useCallback} from 'react'
import {GLOBAL_SEARCH_KEY} from '../constants'

const isSearchHotKey = isHotkey(`mod+${GLOBAL_SEARCH_KEY}`)
const isEscape = isHotkey('escape')

/**
 * This hook binds a global shortcut combination, as well as the ESC key, to open / close callbacks.
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
  onClose?: () => void
  onOpen?: () => void
}): void {
  const {isTopLayer} = useLayer()

  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isSearchHotKey(event)) {
        event.preventDefault()
        if (open) {
          handleClose()
        } else {
          onOpen?.()
        }
      }
      if (isEscape(event) && open && isTopLayer) {
        handleClose()
      }
    },
    [handleClose, isTopLayer, open, onOpen]
  )

  useGlobalKeyDown(handleGlobalKeyDown)
}
