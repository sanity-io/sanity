import type {AssetFromSource, AssetSource} from '@sanity/types'
import {createContext} from 'sanity/_createContext'

/**
 * Callback type for inserting sibling images in array context.
 * @param assets - The assets to insert as new array items
 * @param afterKey - The key of the array item to insert after
 * @internal
 */
export type InsertSiblingImagesCallback = (assets: AssetFromSource[], afterKey: string) => void

/**
 * Callback type for uploading and inserting sibling files in array context.
 * This callback is used for multi-file upload via drag-drop in image arrays.
 *
 * Note: This PR focuses on multi-select images. The `files` callback is included
 * to support drag-drop of multiple files, which naturally flows through the same
 * code path. A future PR could extend this to file arrays if needed.
 *
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

/**
 * Context for sibling image insertion in array context.
 * @internal
 */
export const SiblingImageInsertionContext = createContext<SiblingImageInsertionContextValue>(
  'sanity/_singletons/context/sibling-image-insertion',
  {
    onInsertSiblingImages: undefined,
    onInsertSiblingFiles: undefined,
  },
)
