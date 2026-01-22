import {createContext, type ReactNode, useCallback, useContext, useMemo, useState} from 'react'

/**
 * Context for managing stacked annotation popovers.
 * When multiple annotations overlap on the same text, this context
 * assigns each popover a unique index so they can be vertically stacked
 * without overlapping.
 */

interface AnnotationPopoverStackContextValue {
  /** Register a popover and get its stack index */
  register: (key: string) => number
  /** Unregister a popover */
  unregister: (key: string) => void
  /** Get the current stack index for a popover */
  getIndex: (key: string) => number
}

const AnnotationPopoverStackContext = createContext<AnnotationPopoverStackContextValue | null>(null)

export function AnnotationPopoverStackProvider({children}: {children: ReactNode}): ReactNode {
  // Map of annotation key -> registration order
  const [registeredPopovers, setRegisteredPopovers] = useState<Map<string, number>>(new Map())
  // Counter for assigning indices
  const [counter, setCounter] = useState(0)

  const register = useCallback(
    (key: string): number => {
      let index = 0
      setRegisteredPopovers((prev) => {
        if (prev.has(key)) {
          // Already registered, return existing index
          index = prev.get(key)!
          return prev
        }
        const next = new Map(prev)
        index = counter
        next.set(key, index)
        return next
      })
      setCounter((c) => c + 1)
      return index
    },
    [counter],
  )

  const unregister = useCallback((key: string) => {
    setRegisteredPopovers((prev) => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }, [])

  const getIndex = useCallback(
    (key: string): number => {
      // Get sorted indices of all registered popovers
      const entries = Array.from(registeredPopovers.entries())
      const sortedKeys = entries.sort((a, b) => a[1] - b[1]).map((e) => e[0])
      const idx = sortedKeys.indexOf(key)
      return idx >= 0 ? idx : 0
    },
    [registeredPopovers],
  )

  const value = useMemo(() => ({register, unregister, getIndex}), [register, unregister, getIndex])

  return (
    <AnnotationPopoverStackContext.Provider value={value}>
      {children}
    </AnnotationPopoverStackContext.Provider>
  )
}

/**
 * Hook to access the annotation popover stack context
 * @throws if used outside of AnnotationPopoverStackProvider
 */
export function useAnnotationPopoverStack(): AnnotationPopoverStackContextValue {
  const context = useContext(AnnotationPopoverStackContext)
  if (!context) {
    throw new Error(
      'useAnnotationPopoverStack must be used within an AnnotationPopoverStackProvider',
    )
  }
  return context
}
