import {SchemaType} from '@sanity/types'
import {PreviewPath} from '../types'

const DEFAULT_PREVIEW_PATHS: PreviewPath[] = [['_createdAt'], ['_updatedAt']]

/** @internal */
export function getPreviewPaths(preview: SchemaType['preview']): PreviewPath[] | undefined {
  const selection = preview?.select

  if (!selection) return undefined

  // Transform the selection dot-notation paths into array paths.
  // Example: ['object.title', 'name'] => [['object', 'title'], ['name']]
  const paths = Object.values(selection).map((value) => String(value).split('.')) || []

  // Return the paths with the default preview paths appended.
  return paths.concat(DEFAULT_PREVIEW_PATHS)
}
