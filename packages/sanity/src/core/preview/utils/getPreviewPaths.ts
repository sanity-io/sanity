import {type PreviewableType, type PreviewPath} from '../types'

const DEFAULT_PREVIEW_PATHS: PreviewPath[] = [['_createdAt'], ['_updatedAt']]

/** @internal */
export function getPreviewPaths(preview: PreviewableType['preview']): PreviewPath[] {
  const selection = preview?.select

  // Transform the selection dot-notation paths into array paths.
  // Example: ['object.title', 'name'] => [['object', 'title'], ['name']]
  // When no selection is provided, we still need to return the default paths
  // to ensure proper document observation (fixes draft icon showing incorrectly
  // when using prepare() without select in preview config).
  const paths = selection ? Object.values(selection).map((value) => String(value).split('.')) : []

  // Return the paths with the default preview paths appended.
  return paths.concat(DEFAULT_PREVIEW_PATHS)
}
