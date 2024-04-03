import {type Path} from '@sanity/types'
import {createContext, useMemo} from 'react'

export interface FormPathsContextValue {
  /**
   * Whether there is an available form paths context
   * Use this to check whether the onPathFocus and onPathOpen functions will have any effect
   */
  available: boolean
  onPathFocus: (path: Path) => void
  onPathOpen: (path: Path) => void
}

export const FormPathsCallbacksContext = createContext<FormPathsContextValue>({
  available: false,
  onPathFocus: (path) => {
    console.warn(
      'No FormPathsCallbacksProvider found. This call to `onPathFocus(%o)` has no effect.',
      path,
    )
  },
  onPathOpen: (path) => {
    console.warn(
      'No FormPathsCallbacksProvider found. This call to `onPathOpen(%o)` has no effect.',
      path,
    )
  },
})

export function FormPathCallbacksProvider({
  children,
  onPathFocus,
  onPathOpen,
}: {
  children: React.ReactNode
  onPathFocus: (path: Path) => void
  onPathOpen: (path: Path) => void
}) {
  const value = useMemo(() => {
    return {available: true, onPathFocus: onPathFocus, onPathOpen: onPathOpen}
  }, [onPathFocus, onPathOpen])
  return (
    <FormPathsCallbacksContext.Provider value={value}>
      {children}
    </FormPathsCallbacksContext.Provider>
  )
}
