import {type ReactNode, useCallback, useMemo, useState} from 'react'
import {DialogStackContext} from 'sanity/_singletons'

import {EMPTY_ARRAY} from '../../../util/empty'
import {useFormCallbacks} from './FormCallbacks'

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
  const [stack, setStack] = useState<string[]>([])
  const {onPathOpen} = useFormCallbacks()

  const push = useCallback((id: string) => {
    setStack((prev) => {
      // Don't add if already in stack (prevents infinite loops)
      if (prev.includes(id)) return prev
      return [...prev, id]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setStack((prev) => prev.filter((item) => item !== id))
  }, [])

  const closeAll = useCallback(() => {
    onPathOpen(EMPTY_ARRAY)
    setStack([])
  }, [onPathOpen])

  const value = useMemo(() => ({stack, push, remove, closeAll}), [stack, push, remove, closeAll])

  return <DialogStackContext.Provider value={value}>{children}</DialogStackContext.Provider>
}
