import {type KeyedSegment} from '@sanity/types'
import {type ReactNode, useContext, useMemo} from 'react'

import {
  type InsertSiblingFilesCallback,
  type InsertSiblingImagesCallback,
  SiblingImageInsertionContext,
  type SiblingImageInsertionContextValue,
} from '../../../_singletons/context/SiblingImageInsertionContext'

// Re-export types for convenience
export type {
  InsertSiblingFilesCallback,
  InsertSiblingImagesCallback,
  SiblingImageInsertionContextValue,
}

/**
 * Hook to access the sibling image insertion callback.
 * Returns undefined when not in an array context that supports multi-select.
 * @internal
 */
export function useSiblingImageInsertion(): SiblingImageInsertionContextValue {
  return useContext(SiblingImageInsertionContext)
}

/**
 * Extract the key from a path segment if it's a keyed segment.
 * @internal
 */
export function extractKeyFromPathSegment(segment: unknown): string | undefined {
  if (
    segment &&
    typeof segment === 'object' &&
    '_key' in segment &&
    typeof (segment as KeyedSegment)._key === 'string'
  ) {
    return (segment as KeyedSegment)._key
  }
  return undefined
}

/**
 * Provider for the sibling image insertion context.
 * @internal
 */
export function SiblingImageInsertionProvider(props: {
  onInsertSiblingImages: InsertSiblingImagesCallback | undefined
  onInsertSiblingFiles?: InsertSiblingFilesCallback | undefined
  children: ReactNode
}) {
  const {onInsertSiblingImages, onInsertSiblingFiles, children} = props
  const value = useMemo(
    () => ({onInsertSiblingImages, onInsertSiblingFiles}),
    [onInsertSiblingImages, onInsertSiblingFiles],
  )

  return (
    <SiblingImageInsertionContext.Provider value={value}>
      {children}
    </SiblingImageInsertionContext.Provider>
  )
}
