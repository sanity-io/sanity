import {type AssetFromSource, type AssetSource, type KeyedSegment} from '@sanity/types'
import {createContext, type ReactNode, useContext, useMemo} from 'react'

/**
 * Callback type for inserting sibling images in array context.
 * @param assets - The assets to insert as new array items
 * @param afterKey - The key of the array item to insert after
 * @internal
 */
export type InsertSiblingImagesCallback = (assets: AssetFromSource[], afterKey: string) => void

/**
 * Callback type for uploading and inserting sibling files in array context.
 * @param assetSource - The asset source to use for uploading
 * @param files - The files to upload and insert as new array items
 * @param afterKey - The key of the array item to insert after
 * @internal
 */
export type InsertSiblingFilesCallback = (
  assetSource: AssetSource,
  files: File[],
  afterKey: string,
) => void

/**
 * Context for providing callbacks to insert sibling images in array context.
 * Used when multiple images are selected from an asset source browser or
 * multiple files are uploaded at once.
 * @internal
 */
export interface SiblingImageInsertionContextValue {
  /**
   * Callback to insert additional images as siblings in an array.
   * Called with assets after the first one when multiple are selected,
   * along with the key of the item to insert after.
   */
  onInsertSiblingImages: InsertSiblingImagesCallback | undefined
  /**
   * Callback to upload and insert additional files as siblings in an array.
   * Called with files after the first one when multiple are uploaded,
   * along with the key of the item to insert after.
   */
  onInsertSiblingFiles: InsertSiblingFilesCallback | undefined
}

const SiblingImageInsertionContext = createContext<SiblingImageInsertionContextValue>({
  onInsertSiblingImages: undefined,
  onInsertSiblingFiles: undefined,
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
