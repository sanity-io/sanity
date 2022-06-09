import {SchemaType} from '@sanity/types'
import {Path} from '../types'

export function getPreviewPaths(preview: SchemaType['preview']): Path[] | undefined {
  const selection = preview?.select

  if (!selection) return undefined

  return Object.values(selection).map((value) => String(value).split('.'))
}
