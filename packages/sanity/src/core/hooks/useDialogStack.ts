import {type Path} from '@sanity/types'
import {useContext, useEffect, useId, useRef} from 'react'
import {DialogStackContext} from 'sanity/_singletons'

const noop = (): void => {
  return undefined
}

/**
 * Hook to register a dialog in the stack and check if it's the top-most one.
 *
 * @beta
 */
export function useDialogStack({path}: {path?: Path} = {}) {
  const context = useContext(DialogStackContext)
  const id = useId()
  const hasRegistered = useRef(false)

  // Get stable references to push/remove/update
  const push = context?.push
  const remove = context?.remove
  const update = context?.update

  // Register on mount, remove on unmount (stable deps = runs once)
  useEffect(() => {
    if (!push || !remove) return undefined

    hasRegistered.current = true
    push(id, path)

    return () => {
      hasRegistered.current = false
      remove(id)
    }
  }, [push, remove, id, path])

  useEffect(() => {
    if (update && hasRegistered.current) {
      update(id, path)
    }
  }, [update, id, path])

  const stack = context?.stack ?? []
  const topEntry = stack.length > 0 ? stack[stack.length - 1] : null
  const isTop = context ? topEntry?.id === id : true
  const close = context?.close ?? noop
  const navigateTo = context?.navigateTo ?? noop

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
    /** Navigate to a specific path, updating the form path and cleaning up the stack */
    navigateTo,
  }
}
