import {noop} from 'lodash'
import {useContext, useEffect, useId, useRef} from 'react'
import {DialogStackContext} from 'sanity/_singletons'

/**
 * Hook to register a dialog in the stack and check if it's the top-most one.
 *
 * @beta
 */
export function useDialogStack() {
  const context = useContext(DialogStackContext)
  const id = useId()
  const hasRegistered = useRef(false)

  // Get stable references to push/remove
  const push = context?.push
  const remove = context?.remove

  // Push on mount, remove on unmount
  useEffect(() => {
    if (push && remove && !hasRegistered.current) {
      hasRegistered.current = true
      push(id)
      return () => {
        hasRegistered.current = false
        remove(id)
      }
    }
    return undefined
  }, [push, remove, id])

  const stack = context?.stack ?? []
  const topId = stack.length > 0 ? stack[stack.length - 1] : null
  const isTop = context ? topId === id : true
  const closeAll = context?.closeAll ?? noop

  return {
    /** Unique ID for this dialog instance */
    dialogId: id,
    /** The current top dialog ID */
    topId,
    /** The full stack of dialog IDs */
    stack,
    /** Check if this dialog is on top */
    isTop,
    /** Close all dialogs */
    closeAll,
  }
}
