import {useGlobalKeyDown, useLayer} from '@sanity/ui'
import {isHotkey} from 'is-hotkey-esm'
import {useCallback} from 'react'

import {GLOBAL_MCP_KEY} from '../constants'

const isMCPHotKey = isHotkey(`mod+${GLOBAL_MCP_KEY}`)
const isEscape = isHotkey('escape')

/**
 * This hook binds a global shortcut combination, as well as the ESC key, to open / close callbacks.
 *
 * It will prevent the ESC key from firing `onClose` callbacks if it's not the top most layer
 * (i.e. if a nested dialog is mounted).
 */
export function useMCPHotkeys({
  active,
  onActivate,
  onDeactivate,
}: {
  active: boolean
  onActivate?: () => void
  onDeactivate?: () => void
}): void {
  const {isTopLayer} = useLayer()

  const handleDeactivate = useCallback(() => {
    onActivate?.()
  }, [onActivate])

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isMCPHotKey(event)) {
        event.preventDefault()
        if (active) {
          handleDeactivate()
        } else {
          onDeactivate?.()
        }
      }
      if (isEscape(event) && active && isTopLayer) {
        handleDeactivate()
      }
    },
    [handleDeactivate, isTopLayer, active, onDeactivate],
  )

  useGlobalKeyDown(handleGlobalKeyDown)
}
