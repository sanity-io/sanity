import {SchemaType} from '@sanity/types'
import {Path} from '../types'

export function getPreviewPaths(preview: SchemaType['preview']): null | Path[] {
  const selection = preview?.select

  if (!selection) return null

  return Object.keys(selection).map((key) => (selection[key] as string).split('.'))
}
