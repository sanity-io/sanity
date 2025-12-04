import {type Path} from '@sanity/types'
import {noop} from 'lodash'
import {useContext, useEffect, useId, useRef} from 'react'
import {DialogStackContext} from 'sanity/_singletons'

/**
 * Hook to register a dialog in the stack and check if it's the top-most one.
 *
 * @beta
 */
export function useDialogStack({path}: {path?: Path} = {}) {
  const context = useContext(DialogStackContext)
  const id = useId()
  const hasRegistered = useRef(false)

  // Get stable references to push/remove
  const push = context?.push
  const remove = context?.remove

  // Push on mount with path, remove on unmount
  useEffect(() => {
    if (push && remove && !hasRegistered.current) {
      hasRegistered.current = true
      push(id, path)
      return () => {
        hasRegistered.current = false
        remove(id)
      }
    }
    return undefined
  }, [push, remove, id, path])

  const stack = context?.stack ?? []
  const topEntry = stack.length > 0 ? stack[stack.length - 1] : null
  const isTop = context ? topEntry?.id === id : true
  const close = context?.close ?? noop

  return {
    /** Unique ID for this dialog instance */
    dialogId: id,
    /** The current top dialog entry */
    topEntry,
    /** The full stack of dialog entries (each has id and path) */
    stack,
    /** Check if this dialog is on top */
    isTop,
    /** Close dialogs */
    close,
  }
}
