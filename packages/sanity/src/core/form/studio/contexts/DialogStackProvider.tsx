import {type Path} from '@sanity/types'
import {type ReactNode, useCallback, useMemo, useState} from 'react'
import {DialogStackContext, type DialogStackEntry} from 'sanity/_singletons'

interface DialogStackProviderProps {
  children: ReactNode
}

/**
 * Provider that tracks a stack of open dialogs.
 * The last dialog in the stack is the "top" one.
 *
 * @beta
 */
export function DialogStackProvider({children}: DialogStackProviderProps): React.JSX.Element {
  const [stack, setStack] = useState<DialogStackEntry[]>([])

  const push = useCallback((id: string, path?: Path) => {
    setStack((prev) => {
      // Don't add if already in stack (prevents infinite loops)
      if (prev.some((entry) => entry.id === id)) return prev
      return [...prev, {id, path}]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setStack((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  const update = useCallback((id: string, path?: Path) => {
    setStack((prev) => prev.map((entry) => (entry.id === id ? {...entry, path} : entry)))
  }, [])

  const value = useMemo(
    () => ({stack, push, remove, update, close}),
    [
	stack,
	push,
	remove,
	update
],
  )

  return <DialogStackContext.Provider value={value}>{children}</DialogStackContext.Provider>
}
