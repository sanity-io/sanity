import {type ReactNode, useCallback, useContext, useMemo, useState} from 'react'
import {
  type AnnotationEntry,
  SelectedAnnotationsContext,
  type SelectedAnnotationsContextValue,
} from 'sanity/_singletons'

// Re-export types for convenience
export type {AnnotationEntry, SelectedAnnotationsContextValue}

/**
 * Provider for tracking selected annotations in the Portable Text editor.
 * Enables CombinedAnnotationPopover to show all active annotations in a single popover.
 * @internal
 */
export function SelectedAnnotationsProvider({children}: {children: ReactNode}): ReactNode {
  const [annotationsMap, setAnnotationsMap] = useState<Map<string, AnnotationEntry>>(new Map())

  const register = useCallback((entry: AnnotationEntry) => {
    setAnnotationsMap((prev) => {
      const next = new Map(prev)
      next.set(entry.key, entry)
      return next
    })
  }, [])

  const unregister = useCallback((key: string) => {
    setAnnotationsMap((prev) => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }, [])

  const annotations = useMemo(() => Array.from(annotationsMap.values()), [annotationsMap])

  const value = useMemo(
    () => ({register, unregister, annotations}),
    [register, unregister, annotations],
  )

  return (
    <SelectedAnnotationsContext.Provider value={value}>
      {children}
    </SelectedAnnotationsContext.Provider>
  )
}

/**
 * Hook to access the selected annotations context
 * @throws if used outside of SelectedAnnotationsProvider
 * @internal
 */
export function useSelectedAnnotations(): SelectedAnnotationsContextValue {
  const context = useContext(SelectedAnnotationsContext)
  if (!context) {
    throw new Error('useSelectedAnnotations must be used within a SelectedAnnotationsProvider')
  }
  return context
}
