import {SchemaType} from '@sanity/types'
import {Path} from '../types'

export function getPreviewPaths(type: SchemaType): null | Path[] {
  const selection = type.preview?.select

  if (!selection) return null

  return Object.keys(selection).map((key) => (selection[key] as string).split('.'))
}
