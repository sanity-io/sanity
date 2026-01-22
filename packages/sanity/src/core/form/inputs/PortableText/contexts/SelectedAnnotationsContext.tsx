import {type ObjectSchemaType} from '@sanity/types'
import {createContext, type ReactNode, useCallback, useContext, useMemo, useState} from 'react'

/**
 * Represents a single annotation that is currently selected/active
 */
export interface AnnotationEntry {
  /** Unique key for this annotation instance */
  key: string
  /** Display title (from schema or i18n) */
  title: string
  /** Schema type for this annotation */
  schemaType: ObjectSchemaType
  /** Callback to open the annotation editor */
  onOpen: () => void
  /** Callback to remove the annotation */
  onRemove: () => void
  /** Reference element for this annotation (for positioning) */
  referenceElement: HTMLElement | null
}

interface SelectedAnnotationsContextValue {
  /** Register an annotation as selected */
  register: (entry: AnnotationEntry) => void
  /** Unregister an annotation (no longer selected) */
  unregister: (key: string) => void
  /** All currently selected annotations */
  annotations: AnnotationEntry[]
}

const SelectedAnnotationsContext = createContext<SelectedAnnotationsContextValue | null>(null)

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
 */
export function useSelectedAnnotations(): SelectedAnnotationsContextValue {
  const context = useContext(SelectedAnnotationsContext)
  if (!context) {
    throw new Error('useSelectedAnnotations must be used within a SelectedAnnotationsProvider')
  }
  return context
}
