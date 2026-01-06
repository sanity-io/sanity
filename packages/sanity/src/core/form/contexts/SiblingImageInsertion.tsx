import {type AssetFromSource, type KeyedSegment} from '@sanity/types'
import {createContext, type ReactNode, useContext, useMemo} from 'react'

/**
 * Callback type for inserting sibling images in array context.
 * @param assets - The assets to insert as new array items
 * @param afterKey - The key of the array item to insert after
 * @internal
 */
export type InsertSiblingImagesCallback = (assets: AssetFromSource[], afterKey: string) => void

/**
 * Context for providing a callback to insert sibling images in array context.
 * Used when multiple images are selected from an asset source browser.
 * @internal
 */
export interface SiblingImageInsertionContextValue {
  /**
   * Callback to insert additional images as siblings in an array.
   * Called with assets after the first one when multiple are selected,
   * along with the key of the item to insert after.
   */
  onInsertSiblingImages: InsertSiblingImagesCallback | undefined
}

const SiblingImageInsertionContext = createContext<SiblingImageInsertionContextValue>({
  onInsertSiblingImages: undefined,
})

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
  children: ReactNode
}) {
  const {onInsertSiblingImages, children} = props
  const value = useMemo(() => ({onInsertSiblingImages}), [onInsertSiblingImages])

  return (
    <SiblingImageInsertionContext.Provider value={value}>
      {children}
    </SiblingImageInsertionContext.Provider>
  )
}
