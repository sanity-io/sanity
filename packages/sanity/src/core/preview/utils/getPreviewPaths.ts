import {SchemaType} from '@sanity/types'
import {PreviewPath} from '../types'

/** @internal */
export function getPreviewPaths(preview: SchemaType['preview']): PreviewPath[] | undefined {
  const selection = preview?.select

  if (!selection) return undefined

  return [
    ...(Object.values(selection).map((value) => String(value).split('.')) || []),
    ['_createdAt'],
    ['_updatedAt'],
  ]
}
